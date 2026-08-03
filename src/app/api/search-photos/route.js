import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateImageEmbedding,
  generateTextEmbedding,
} from "@/lib/embeddings/imageEmbeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MINIMUM_SEARCH_SIMILARITY = 0.25;
const SEARCH_RESULT_LIMIT = 12;
const DEBUG_SEARCH_THRESHOLD = -1;
const DEBUG_SEARCH_RESULT_LIMIT = 50;

function logFullSearchError(label, error) {
  /*
    These logs help debug model-loading, embedding, and Supabase RPC problems.
    The browser only gets a friendly message; the terminal gets the details.
  */
  console.error(label, error);
  console.error(`${label} message:`, error?.message);
  console.error(`${label} stack:`, error?.stack);
}

async function getSearchInput(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const uploadedImage = formData.get("image");
    const query = String(formData.get("query") || "").trim();

    /*
      If a visitor chooses an image, we use image search first.
      Otherwise we fall back to the typed text query.
    */
    if (
      uploadedImage &&
      typeof uploadedImage.arrayBuffer === "function" &&
      uploadedImage.size > 0
    ) {
      return { type: "image", value: uploadedImage };
    }

    if (query) {
      return { type: "text", value: query };
    }

    return null;
  }

  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim() : "";

  if (query) {
    return { type: "text", value: query };
  }

  return null;
}

async function searchPortfolioImages(supabase, queryEmbedding) {
  /*
    The database function is already ordered by similarity, best match first.
    Passing match_threshold here lets Supabase return zero results when nothing
    is meaningfully similar instead of forcing a fixed number of weak matches.
  */
  return supabase.rpc("match_portfolio_images", {
    query_embedding: queryEmbedding,
    match_count: SEARCH_RESULT_LIMIT,
    match_threshold: MINIMUM_SEARCH_SIMILARITY,
  });
}

async function debugUnfilteredPortfolioSearch(supabase, queryEmbedding) {
  /*
    Temporary debug call:
    This bypasses the real threshold so we can see the raw score range coming
    back from Supabase. The actual website results still use the real threshold.
  */
  return supabase.rpc("match_portfolio_images", {
    query_embedding: queryEmbedding,
    match_count: DEBUG_SEARCH_RESULT_LIMIT,
    match_threshold: DEBUG_SEARCH_THRESHOLD,
  });
}

function logQueryEmbeddingSummary(queryEmbedding) {
  /*
    The full vector has 512 numbers, so logging the entire thing would be noisy.
    Length + first 5 values tells us whether the model returned a real vector.
  */
  console.log("Photo search query embedding summary:", {
    length: queryEmbedding.length,
    firstFiveValues: queryEmbedding.slice(0, 5),
  });
}

function logSimilarityScores(label, results) {
  /*
    Debug log:
    This keeps the terminal output readable while still showing the score range
    and order returned by the database.
  */
  console.log(
    label,
    (results || []).map((photo) => ({
      id: photo.id,
      category: photo.category,
      similarity: Number(photo.similarity || 0),
    })),
  );
}

export async function POST(request) {
  try {
    const searchInput = await getSearchInput(request);

    if (!searchInput) {
      return NextResponse.json(
        { error: "Please provide either a text query or an image." },
        { status: 400 },
      );
    }

    let queryEmbedding;

    try {
      console.log(`Starting ${searchInput.type} search embedding generation...`);

      queryEmbedding =
        searchInput.type === "image"
          ? await generateImageEmbedding(searchInput.value)
          : await generateTextEmbedding(searchInput.value);

      console.log("Search embedding generated successfully");
      logQueryEmbeddingSummary(queryEmbedding);
    } catch (embeddingError) {
      logFullSearchError("Photo search embedding failed", embeddingError);

      return NextResponse.json(
        { error: "Could not understand that search. Please try again." },
        { status: 500 },
      );
    }

    const supabase = await createClient();

    /*
      TEMPORARY DEBUGGING:
      First ask Supabase for unfiltered results with threshold -1. This lets us
      see whether scores exist but are below 0.25, or whether the RPC/vector is
      failing before the real threshold is applied.
    */
    const {
      data: unfilteredData,
      error: unfilteredError,
    } = await debugUnfilteredPortfolioSearch(supabase, queryEmbedding);

    if (unfilteredError) {
      logFullSearchError(
        "Unfiltered photo search debug RPC failed",
        unfilteredError,
      );
    } else {
      logSimilarityScores(
        "UNFILTERED portfolio search similarity scores (threshold -1):",
        unfilteredData,
      );
    }

    /*
      match_portfolio_images is a Supabase database function that compares
      this query vector against the stored portfolio_images.embedding values.
    */
    const { data, error } = await searchPortfolioImages(supabase, queryEmbedding);

    if (error) {
      logFullSearchError("Photo search RPC failed", error);

      return NextResponse.json(
        { error: "Photo search failed. Please try again." },
        { status: 500 },
      );
    }

    logSimilarityScores(
      `FILTERED portfolio search similarity scores returned by Supabase (threshold ${MINIMUM_SEARCH_SIMILARITY}):`,
      data,
    );

    const matches = (data || [])
      .filter((photo) => {
        /*
          The SQL function applies this threshold first. Keeping the same check
          here protects the UI if the database function changes later.
        */
        const similarity = Number(photo.similarity || 0);
        return photo.image_url && similarity > MINIMUM_SEARCH_SIMILARITY;
      })
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((photo) => ({
        id: photo.id,
        category: photo.category,
        image_url: photo.image_url,
        similarity: photo.similarity,
      }));

    return NextResponse.json({ matches });
  } catch (routeError) {
    logFullSearchError("Photo search route failed", routeError);

    return NextResponse.json(
      { error: "Photo search failed. Please try again." },
      { status: 500 },
    );
  }
}
