import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  ATLAS_SYSTEM_PROMPT,
  MAX_HISTORY_MESSAGES,
  MAX_INPUT_CHARS,
} from "@/lib/atlas";

export const runtime = "nodejs";
/** Streaming responses must never be cached or statically evaluated. */
export const dynamic = "force-dynamic";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Validates the client payload into the shape the upstream API expects. */
function parseMessages(value: unknown): IncomingMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const out: IncomingMessage[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed) continue;
    out.push({ role, content: trimmed.slice(0, MAX_INPUT_CHARS) });
  }

  if (out.length === 0) return null;
  // Keep the newest turns; the oldest context is the cheapest to drop.
  return out.slice(-MAX_HISTORY_MESSAGES);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseURL = process.env.NVIDIA_BASE_URL;
  const model = process.env.NVIDIA_MODEL_NAME;

  if (!apiKey || !baseURL || !model) {
    return badRequest(
      "ATLAS is not configured. Set NVIDIA_API_KEY, NVIDIA_BASE_URL and NVIDIA_MODEL_NAME in .env.local.",
      500,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be JSON.");
  }

  const messages = parseMessages((body as { messages?: unknown })?.messages);
  if (!messages) {
    return badRequest("Provide a non-empty `messages` array of user/assistant turns.");
  }

  const client = new OpenAI({ apiKey, baseURL });

  const payload: ChatCompletionMessageParam[] = [
    { role: "system", content: ATLAS_SYSTEM_PROMPT },
    ...messages,
  ];

  let upstream;
  try {
    upstream = await client.chat.completions.create(
      {
        model,
        messages: payload,
        stream: true,
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 2048,
      },
      { signal: req.signal },
    );
  } catch (error) {
    const status =
      error instanceof OpenAI.APIError && error.status ? error.status : 502;
    const detail =
      error instanceof Error ? error.message : "Unknown upstream failure.";
    return badRequest(`Upstream request failed: ${detail}`, status);
  }

  const encoder = new TextEncoder();

  // Plain UTF-8 text stream: the client appends chunks verbatim, so there is
  // no SSE framing to parse and no buffering between token and pixel.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of upstream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (error) {
        // The client aborts on stop; that is not an error worth surfacing.
        if (!req.signal.aborted) {
          const detail =
            error instanceof Error ? error.message : "stream interrupted";
          controller.enqueue(encoder.encode(`\n\n[stream error: ${detail}]`));
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      upstream.controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
