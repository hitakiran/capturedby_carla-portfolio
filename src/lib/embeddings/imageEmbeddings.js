const CLIP_MODEL_NAME = "Xenova/clip-vit-base-patch32";
const EXPECTED_EMBEDDING_SIZE = 512;

let imageFeatureExtractorPromise = null;
let textEmbeddingToolsPromise = null;

async function getImageFeatureExtractor() {
  if (!imageFeatureExtractorPromise) {
    /*
      Loading the CLIP model is the slowest part of this feature.
      Keeping the promise in this module-level variable means the server
      loads it once, then reuses it for later uploads while the process is alive.
    */
    imageFeatureExtractorPromise = import("@huggingface/transformers").then(({ pipeline }) =>
      pipeline("image-feature-extraction", CLIP_MODEL_NAME),
    );
  }

  try {
    return await imageFeatureExtractorPromise;
  } catch (error) {
    /*
      If the first model load fails, reset the promise so the next upload
      can try again instead of being stuck with the failed promise forever.
    */
    imageFeatureExtractorPromise = null;
    throw error;
  }
}

async function getTextEmbeddingTools() {
  if (!textEmbeddingToolsPromise) {
    /*
      Text search uses the text half of CLIP. We load both the tokenizer
      and the text model once, then reuse them for later searches.
    */
    textEmbeddingToolsPromise = import("@huggingface/transformers").then(
      async ({ AutoTokenizer, CLIPTextModelWithProjection }) => {
        const [tokenizer, textModel] = await Promise.all([
          AutoTokenizer.from_pretrained(CLIP_MODEL_NAME),
          CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_NAME),
        ]);

        return { tokenizer, textModel };
      },
    );
  }

  try {
    return await textEmbeddingToolsPromise;
  } catch (error) {
    /*
      Reset the cached promise if loading fails so a later search can retry.
    */
    textEmbeddingToolsPromise = null;
    throw error;
  }
}

function tensorToEmbedding(tensor) {
  const embedding = Array.from(tensor?.data || []);

  if (embedding.length !== EXPECTED_EMBEDDING_SIZE) {
    throw new Error(
      `Expected ${EXPECTED_EMBEDDING_SIZE} embedding values, but received ${embedding.length}.`,
    );
  }

  // Supabase pgvector can receive this as a regular JavaScript number array.
  return embedding.map((value) => Number(value));
}

export async function generateImageEmbedding(imageSource) {
  const imageFeatureExtractor = await getImageFeatureExtractor();

  /*
    The CLIP image-feature-extraction pipeline accepts either an image URL
    or a File/Blob from an upload. It returns a Tensor with 512 values.
  */
  const features = await imageFeatureExtractor(imageSource);

  return tensorToEmbedding(features);
}

export async function generateTextEmbedding(text) {
  const { tokenizer, textModel } = await getTextEmbeddingTools();

  /*
    CLIP turns text and images into vectors in the same "meaning space."
    A phrase like "golden hour couple session" can therefore be compared
    against the image embeddings stored in portfolio_images.
  */
  const textInputs = tokenizer([text], {
    padding: true,
    truncation: true,
  });
  const { text_embeds: textEmbeds } = await textModel(textInputs);

  return tensorToEmbedding(textEmbeds);
}
