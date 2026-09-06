# ATLAS 2.1

A text-only reasoning interface for NVIDIA's **Nemotron 3.5 Lightning 30B A3B**,
built on Next.js App Router. Two surfaces: a landing page and a streaming chat
interface. The API key stays server-side.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your key
npm run dev
```

### Environment

| Variable | Purpose |
| --- | --- |
| `NVIDIA_API_KEY` | Your NVIDIA API key. Read only in the route handler. |
| `NVIDIA_BASE_URL` | OpenAI-compatible base URL. NVIDIA's build platform serves this at `https://integrate.api.nvidia.com/v1`. |
| `NVIDIA_MODEL_NAME` | `nvidia/nemotron-3.5-lightning-30b-a3b` |

## Architecture

- `src/app/api/chat/route.ts` — server-only route handler. Validates the
  payload, injects the text-only system prompt, and pipes the upstream token
  stream back as plain UTF-8. Aborts propagate upstream on stop.
- `src/lib/atlas.ts` — the shared contract: message types, the system prompt,
  and input limits.
- `src/components/useAtlasChat.ts` — all chat state: sessions, streaming,
  `localStorage` persistence.
- `src/components/motion.ts` — the single motion rhythm (durations, easings,
  stagger) every animation draws from.

## The text-only constraint

The system prompt is injected server-side and forbids images, data URIs, ASCII
art, tables, and layout-implying markdown. The client reinforces it: responses
render through `AtlasText`, which splits paragraphs and prints plain text. There
is deliberately no markdown renderer — adding one would invite the formatting
the prompt rules out.

## Design

Dark, hairline-ruled, one warm signal accent. Tokens live in
`src/app/globals.css`; components consume them through Tailwind theme names
(`bg-base`, `border-line`, `text-ink-2`, `text-signal`) rather than raw hex.
Motion honours `prefers-reduced-motion` — the launch transition, the streaming
caret, and every entrance collapse to a cut.
