import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateImageEmbedding } from "@/lib/embeddings/imageEmbeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function logFullRouteError(label, error) {
  /*
    Logging the message and stack separately makes debugging much easier.
    Some libraries print only "[object Object]" unless we pull these fields out.
  */
  console.error(label, error);
  console.error(`${label} message:`, error?.message);
  console.error(`${label} stack:`, error?.stack);
}

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Only a signed-in admin should be able to create portfolio image rows.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to upload photos." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";

    if (!category || !imageUrl) {
      return NextResponse.json(
        { error: "A category and image URL are required." },
        { status: 400 },
      );
    }

    let embedding = null;

    try {
      console.log("Starting embedding generation...");
      embedding = await generateImageEmbedding(imageUrl);
      console.log("Embedding generated successfully");
    } catch (embeddingError) {
      /*
        Embeddings are helpful, but they should never block Carla from uploading.
        If CLIP fails to load or process the image, save the photo without an
        embedding and log the issue for later troubleshooting/regeneration.
      */
      logFullRouteError("Portfolio image embedding failed", embeddingError);
    }

    const rowToInsert = {
      category,
      image_url: imageUrl,
    };

    if (embedding) {
      rowToInsert.embedding = embedding;
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from("portfolio_images")
      .insert(rowToInsert)
      .select("id, category, image_url, created_at")
      .single();

    if (insertError) {
      logFullRouteError("Portfolio image database insert failed", insertError);

      return NextResponse.json(
        { error: "The photo uploaded, but the database row could not be saved." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      image: insertedRow,
      embeddingGenerated: Boolean(embedding),
    });
  } catch (routeError) {
    logFullRouteError("Portfolio image route failed", routeError);

    return NextResponse.json(
      { error: "The portfolio photo upload route failed. Check the terminal for details." },
      { status: 500 },
    );
  }
}
