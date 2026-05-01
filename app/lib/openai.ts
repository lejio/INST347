import OpenAI from "openai";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

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

const MAX_RECURSIVE_CALLS = 20;
const DOCX_TARGET_CHUNK_CHARS = 5000;
const PDF_TARGET_CHUNK_CHARS = 4500;
const MAX_OUTPUT_TOKENS = 2048;
// Stay under the org's gpt-4o TPM limit (default 30k). Leave headroom.
const TPM_LIMIT = 28000;
const CONCURRENCY = 5;

// Rough char->token estimate for input (gpt-4o is ~4 chars/token).
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Sliding-window token-per-minute limiter. Single instance shared across calls.
class TokenBucket {
  private events: { ts: number; tokens: number }[] = [];
  private chain: Promise<void> = Promise.resolve();

  constructor(private limit: number, private windowMs = 60_000) {}

  private prune(now: number) {
    const cutoff = now - this.windowMs;
    while (this.events.length && this.events[0].ts < cutoff) {
      this.events.shift();
    }
  }

  private used(now: number): number {
    this.prune(now);
    return this.events.reduce((s, e) => s + e.tokens, 0);
  }

  // Reserve `tokens` budget; resolves when budget is available. Serialized so
  // concurrent callers don't all see "available" at once.
  reserve(tokens: number): Promise<void> {
    const run = async () => {
      const cost = Math.min(tokens, this.limit);
      // Wait until adding `cost` keeps us under the limit.
      while (this.used(Date.now()) + cost > this.limit) {
        const oldest = this.events[0];
        const waitMs = oldest
          ? Math.max(50, oldest.ts + this.windowMs - Date.now() + 50)
          : 250;
        await new Promise((r) => setTimeout(r, waitMs));
      }
      this.events.push({ ts: Date.now(), tokens: cost });
    };
    const next = this.chain.then(run, run);
    this.chain = next.catch(() => {});
    return next;
  }
}

const tpmBucket = new TokenBucket(TPM_LIMIT);

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

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
  // Estimate input tokens from message text content for the budget reservation.
  const inputText = messages
    .map((m) => {
      if (typeof m.content === "string") return m.content;
      if (Array.isArray(m.content)) {
        return m.content
          .map((p) => ("text" in p && typeof p.text === "string" ? p.text : ""))
          .join("");
      }
      return "";
    })
    .join("\n");
  const estimated = estimateTokens(inputText) + MAX_OUTPUT_TOKENS;

  const maxAttempts = 4;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await tpmBucket.reserve(estimated);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        max_tokens: MAX_OUTPUT_TOKENS,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const parsed = JSON.parse(content);
      return normalizeCards(parsed.cards);
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      if (status !== 429 || attempt === maxAttempts) throw err;
      // Honor server-suggested retry delay if present, else exponential backoff.
      const message = (err as { message?: string })?.message ?? "";
      const match = message.match(/try again in ([\d.]+)s/i);
      const waitMs = match
        ? Math.ceil(parseFloat(match[1]) * 1000) + 250
        : Math.min(20_000, 1000 * 2 ** attempt);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
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

  logGeneration(operationId, "DOCX generation started", {
    fileName,
    textLength: text.length,
    chunkSize,
    chunkCount: chunks.length,
    maxRecursiveCalls: MAX_RECURSIVE_CALLS,
  });

  const chunkResults = await mapWithConcurrency(
    chunks,
    CONCURRENCY,
    async (chunk, index) => {
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
      logGeneration(operationId, "DOCX chunk processed", {
        chunk: index + 1,
        totalChunks: chunks.length,
        chunkCards: chunkCards.length,
      });
      return chunkCards;
    }
  );

  const cards: FlashCard[] = chunkResults.flat();

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
  const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
  const { text: textPages, totalPages } = await extractText(pdf, {
    mergePages: false,
  });
  const pages = Array.isArray(textPages) ? textPages : [textPages];
  const text = pages.join("\n\n").trim();

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

  logGeneration(operationId, "PDF generation started", {
    fileName,
    textLength: text.length,
    pageCount: totalPages,
    chunkSize,
    chunkCount: chunks.length,
    maxRecursiveCalls: MAX_RECURSIVE_CALLS,
  });

  const chunkResults = await mapWithConcurrency(
    chunks,
    CONCURRENCY,
    async (chunk, index) => {
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
      logGeneration(operationId, "PDF chunk processed", {
        chunk: index + 1,
        totalChunks: chunks.length,
        chunkCards: chunkCards.length,
      });
      return chunkCards;
    }
  );

  const cards: FlashCard[] = chunkResults.flat();

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
