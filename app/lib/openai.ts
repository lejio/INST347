import OpenAI from "openai";
import mammoth from "mammoth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const SYSTEM_PROMPT = `You are a flashcard generator. Given study material (text, images, or documents), create comprehensive flashcards that cover the key concepts.

Return a JSON object with a single key "cards" containing an array of flashcard objects. Each object must have:
- "front": The question or prompt (concise but clear)
- "back": The answer or explanation (thorough but focused)
- "link": A reference to where in the source material this information came from (e.g., "Page 1", "Section: Introduction", "Diagram caption", etc.)

Generate as many cards as needed to cover the material thoroughly. Aim for 5-20 cards depending on content density.

Return ONLY valid JSON. No markdown, no extra text.`;

export interface FlashCard {
  front: string;
  back: string;
  link: string;
}

export async function generateFlashcards(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<FlashCard[]> {
  let messages: OpenAI.ChatCompletionMessageParam[];

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    // DOCX: extract text with mammoth, then send as text
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Create flashcards from this document (${fileName}):\n\n${result.value}`,
      },
    ];
  } else if (mimeType === "image/png" || mimeType === "image/jpeg") {
    // Images: use vision API with base64
    const base64 = fileBuffer.toString("base64");
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Create flashcards from this image (${fileName}):`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ];
  } else if (mimeType === "application/pdf") {
    // PDF: send as file via base64 (gpt-4o supports native PDF)
    const base64 = fileBuffer.toString("base64");
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Create flashcards from this PDF (${fileName}):`,
          },
          {
            type: "file",
            file: {
              filename: fileName,
              file_data: `data:application/pdf;base64,${base64}`,
            },
          } as unknown as OpenAI.ChatCompletionContentPartText,
        ],
      },
    ];
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content);
  const cards: FlashCard[] = parsed.cards;

  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("OpenAI returned no flashcards");
  }

  // Validate each card has required fields
  for (const card of cards) {
    if (typeof card.front !== "string" || typeof card.back !== "string" || typeof card.link !== "string") {
      throw new Error("Invalid flashcard format from OpenAI");
    }
  }

  return cards;
}
