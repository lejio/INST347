import OpenAI from "openai";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import path from "node:path";
import { pathToFileURL } from "node:url";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// In Next.js server routes, explicitly point pdf.js worker to a real file path.
if (typeof window === "undefined") {
  const workerPath = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  PDFParse.setWorker(pathToFileURL(workerPath).toString());
}

const SYSTEM_PROMPT = `You are a flashcard generator. Given study material (text, images, or documents), create comprehensive flashcards that cover the key concepts.

Return a JSON object with a single key "cards" containing an array of flashcard objects. Each object must have:
- "front": The question or prompt (concise but clear)
- "back": The answer or explanation (thorough but focused)
- "link": A reference to where in the source material this information came from (e.g., "Page 1", "Section: Introduction", "Diagram caption", etc.)

Generate as many cards as needed to cover the material thoroughly. Aim for 5-20 cards depending on content density.

Return ONLY valid JSON. No markdown, no extra text.`;

const MAX_RECURSIVE_CALLS = 20;
const DOCX_TARGET_CHUNK_CHARS = 5000;
const PDF_TARGET_CHUNK_CHARS = 4500;

function logGeneration(operationId: string, message: string, meta?: object) {
  if (meta) {
    console.log(`[flashcards:${operationId}] ${message}`, meta);
    return;
  }
  console.log(`[flashcards:${operationId}] ${message}`);
}

export interface FlashCard {
  front: string;
  back: string;
  link: string;
}

function clampCallCount(count: number): number {
  return Math.max(1, Math.min(MAX_RECURSIVE_CALLS, count));
}

function normalizeCards(cards: unknown): FlashCard[] {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards
    .filter(
      (card): card is FlashCard =>
        !!card &&
        typeof card === "object" &&
        typeof (card as FlashCard).front === "string" &&
        typeof (card as FlashCard).back === "string" &&
        typeof (card as FlashCard).link === "string"
    )
    .map((card) => ({
      front: card.front.trim(),
      back: card.back.trim(),
      link: card.link.trim(),
    }))
    .filter((card) => card.front.length > 0 && card.back.length > 0);
}

function dedupeCards(cards: FlashCard[]): FlashCard[] {
  const seen = new Set<string>();
  const deduped: FlashCard[] = [];

  for (const card of cards) {
    const key = `${card.front.toLowerCase()}|${card.back.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(card);
  }

  return deduped;
}

function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const cleaned = text.replace(/\r/g, "").trim();
  if (!cleaned) {
    return [];
  }

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [cleaned.slice(0, maxChars)];
  }

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (paragraph.length <= maxChars) {
      current = paragraph;
      continue;
    }

    for (let i = 0; i < paragraph.length; i += maxChars) {
      chunks.push(paragraph.slice(i, i + maxChars));
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function callOpenAiForCards(
  messages: OpenAI.ChatCompletionMessageParam[]
): Promise<FlashCard[]> {
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
  return normalizeCards(parsed.cards);
}

async function generateDocxFlashcards(
  fileBuffer: Buffer,
  fileName: string,
  operationId: string
): Promise<FlashCard[]> {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  const text = result.value?.trim();

  if (!text) {
    throw new Error("Could not extract text from DOCX");
  }

  const estimatedCalls = clampCallCount(
    Math.ceil(text.length / DOCX_TARGET_CHUNK_CHARS)
  );

  const chunkSize = Math.max(
    DOCX_TARGET_CHUNK_CHARS,
    Math.ceil(text.length / estimatedCalls)
  );

  const chunks = splitTextIntoChunks(text, chunkSize).slice(0, MAX_RECURSIVE_CALLS);
  const cards: FlashCard[] = [];

  logGeneration(operationId, "DOCX generation started", {
    fileName,
    textLength: text.length,
    chunkSize,
    chunkCount: chunks.length,
    maxRecursiveCalls: MAX_RECURSIVE_CALLS,
  });

  async function processChunk(index: number): Promise<void> {
    if (index >= chunks.length) {
      return;
    }

    const chunk = chunks[index];
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `This is chunk ${index + 1} of ${chunks.length} from ${fileName}. ` +
          "Generate flashcards ONLY for this chunk and avoid duplicates from prior chunks.\n\n" +
          chunk,
      },
    ];

    const chunkCards = await callOpenAiForCards(messages);
    cards.push(...chunkCards);

    logGeneration(operationId, "DOCX chunk processed", {
      chunk: index + 1,
      totalChunks: chunks.length,
      chunkCards: chunkCards.length,
      runningTotalCards: cards.length,
    });

    await processChunk(index + 1);
  }

  await processChunk(0);

  const deduped = dedupeCards(cards);
  logGeneration(operationId, "DOCX generation completed", {
    rawCards: cards.length,
    dedupedCards: deduped.length,
  });

  if (deduped.length === 0) {
    throw new Error("OpenAI returned no flashcards");
  }

  return deduped;
}

async function generatePdfFlashcards(
  fileBuffer: Buffer,
  fileName: string,
  operationId: string
): Promise<FlashCard[]> {
  const parser = new PDFParse({ data: fileBuffer });
  let result: Awaited<ReturnType<PDFParse["getText"]>>;
  try {
    result = await parser.getText();
  } finally {
    await parser.destroy();
  }
  const text = result.text?.trim();

  if (!text) {
    throw new Error(
      "Could not extract text from PDF. The PDF may be scanned/image-only."
    );
  }

  const estimatedCalls = clampCallCount(
    Math.ceil(text.length / PDF_TARGET_CHUNK_CHARS)
  );

  const chunkSize = Math.max(
    PDF_TARGET_CHUNK_CHARS,
    Math.ceil(text.length / estimatedCalls)
  );

  const chunks = splitTextIntoChunks(text, chunkSize).slice(0, MAX_RECURSIVE_CALLS);
  const cards: FlashCard[] = [];

  logGeneration(operationId, "PDF generation started", {
    fileName,
    textLength: text.length,
    pageCount: result.pages?.length,
    chunkSize,
    chunkCount: chunks.length,
    maxRecursiveCalls: MAX_RECURSIVE_CALLS,
  });

  async function processChunk(index: number): Promise<void> {
    if (index >= chunks.length) {
      return;
    }

    const chunk = chunks[index];
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `This is PDF text chunk ${index + 1} of ${chunks.length} from ${fileName}. ` +
          "Generate flashcards ONLY for this chunk and avoid duplicates from prior chunks.\n\n" +
          chunk,
      },
    ];

    const chunkCards = await callOpenAiForCards(messages);
    cards.push(...chunkCards);

    logGeneration(operationId, "PDF chunk processed", {
      chunk: index + 1,
      totalChunks: chunks.length,
      chunkCards: chunkCards.length,
      runningTotalCards: cards.length,
    });

    await processChunk(index + 1);
  }

  await processChunk(0);

  const deduped = dedupeCards(cards);
  logGeneration(operationId, "PDF generation completed", {
    rawCards: cards.length,
    dedupedCards: deduped.length,
  });

  if (deduped.length === 0) {
    throw new Error("OpenAI returned no flashcards");
  }

  return deduped;
}

async function generateImageFlashcards(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  operationId: string
): Promise<FlashCard[]> {
  const base64 = fileBuffer.toString("base64");
  const calls = clampCallCount(Math.ceil(fileBuffer.length / (2 * 1024 * 1024)));
  const cards: FlashCard[] = [];

  logGeneration(operationId, "Image generation started", {
    fileName,
    mimeType,
    fileBytes: fileBuffer.length,
    plannedCalls: calls,
    maxRecursiveCalls: MAX_RECURSIVE_CALLS,
  });

  async function processPass(pass: number): Promise<void> {
    if (pass > calls || pass > MAX_RECURSIVE_CALLS) {
      return;
    }

    const priorFronts = cards.slice(-30).map((c) => c.front).join("\n- ");
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Pass ${pass} of ${calls} for ${fileName}. ` +
              "Focus on concepts not already covered.\n" +
              (priorFronts ? `Already-covered fronts:\n- ${priorFronts}` : ""),
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

    const passCards = await callOpenAiForCards(messages);
    cards.push(...passCards);

    logGeneration(operationId, "Image pass processed", {
      pass,
      totalPasses: calls,
      passCards: passCards.length,
      runningTotalCards: cards.length,
    });

    await processPass(pass + 1);
  }

  await processPass(1);

  const deduped = dedupeCards(cards);
  logGeneration(operationId, "Image generation completed", {
    rawCards: cards.length,
    dedupedCards: deduped.length,
  });

  if (deduped.length === 0) {
    throw new Error("OpenAI returned no flashcards");
  }

  return deduped;
}

export async function generateFlashcards(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<FlashCard[]> {
  const operationId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  logGeneration(operationId, "Generation request received", {
    fileName,
    mimeType,
    fileBytes: fileBuffer.length,
  });

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return generateDocxFlashcards(fileBuffer, fileName, operationId);
  }

  if (mimeType === "application/pdf") {
    return generatePdfFlashcards(fileBuffer, fileName, operationId);
  }

  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    return generateImageFlashcards(fileBuffer, mimeType, fileName, operationId);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
