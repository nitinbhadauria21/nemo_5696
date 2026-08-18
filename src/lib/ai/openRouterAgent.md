# OpenRouter task router agent

Speed-first router that maps an AI **task** to an ordered chain of OpenRouter models, preferring allowlisted `:free` / `openrouter/free` endpoints to minimize latency and cost.

Implementation: [`openRouterRouter.ts`](./openRouterRouter.ts).

## Purpose

- Choose the best **free** model chain for a task (`script`, `analysis`, `ideas`, `sentiment`, `chat`).
- Cap the chain at **3 models**; try **1 attempt per model**.
- Fail over quickly on rate limits, gateway timeouts, empty responses, and privacy/ZDR blocks.
- Optionally append ultra-cheap **paid** twins when `OPENROUTER_ALLOW_PAID_FALLBACK=true` (off by default).

## Entry points and call graph

```
API / callers
  ├─ src/app/api/ai/chat-completion/route.ts
  │    taskHint ?? inferTaskFromMessages(messages)
  │    → selectOpenRouterRoute(...)
  │    → createCompletionWithFallbacks(...)   [providers.ts]
  │
  └─ src/lib/ai/runPrompt.ts  (runAiPrompt)
       options.task
       → selectOpenRouterRoute(...)
       → createCompletionWithFallbacks(...)
```

Both OpenRouter paths log a decision line:

```text
[openrouter-agent] { task, primary, models, strategy, ... }
```

Allowlists for request policy also live in [`requestPolicy.ts`](./requestPolicy.ts) (`ALLOWED_MODELS.OPENROUTER`).

## Tasks

| Task        | How resolved                                           | Default reason string                       |
| ----------- | ------------------------------------------------------ | ------------------------------------------- |
| `script`    | hint, or message match (`NemoScript`, `viralScore`, …) | Viral scripts → fast free models first…     |
| `analysis`  | hint, or trend-analysis phrasing                       | Trend analysis → compact free models first  |
| `ideas`     | hint, or content-ideas phrasing                        | Content ideas → fast generative free models |
| `sentiment` | hint, or brand-safety / sentiment phrasing             | Sentiment → compact free classifiers        |
| `chat`      | default / unknown hint                                 | Chat → fastest free models                  |

`resolveOpenRouterTask` lowercases the hint; anything unknown becomes `chat`.

## Current speed-first free chains

Default (`OPENROUTER_ALLOW_PAID_FALLBACK` unset/false): free-only, up to `OPENROUTER_MAX_MODELS` (3). Preferred `AI_MODEL` is prepended when it is an allowlisted free id.

| Task        | Chain (order)                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `script`    | `google/gemma-4-26b-a4b-it:free` → `google/gemma-4-31b-it:free` → `openai/gpt-oss-20b:free`                      |
| `analysis`  | `nvidia/nemotron-3-nano-30b-a3b:free` → `openai/gpt-oss-20b:free` → `google/gemma-4-26b-a4b-it:free`             |
| `ideas`     | `openai/gpt-oss-20b:free` → `nvidia/nemotron-nano-9b-v2:free` → `google/gemma-4-26b-a4b-it:free`                 |
| `sentiment` | `nvidia/nemotron-nano-9b-v2:free` → `inclusionai/ling-3.0-tiny:free` → `nvidia/nemotron-3.5-content-safety:free` |
| `chat`      | `nvidia/nemotron-nano-9b-v2:free` → `inclusionai/ling-3.0-tiny:free` → `openai/gpt-oss-20b:free`                 |

Empty-chain safety net: `openai/gpt-oss-20b:free`, `nvidia/nemotron-nano-9b-v2:free`.

## Paid fallback (opt-in)

When `OPENROUTER_ALLOW_PAID_FALLBACK=true`:

1. Keep the **first free** model from the task chain as primary.
2. Append task-specific cheap paid twins (still capped at 3 total).

| Task        | Paid twins (after free primary)                                                               |
| ----------- | --------------------------------------------------------------------------------------------- |
| `script`    | `google/gemma-4-31b-it`, `google/gemma-3-12b-it`, `meta-llama/llama-3.1-8b-instruct`          |
| `analysis`  | `google/gemma-4-26b-a4b-it`, `google/gemma-3-12b-it`, `meta-llama/llama-3.1-8b-instruct`      |
| `ideas`     | `google/gemma-4-31b-it`, `google/gemma-3-12b-it`, `mistralai/mistral-small-24b-instruct-2501` |
| `sentiment` | `google/gemma-3-4b-it`, `meta-llama/llama-3.2-3b-instruct`, `mistralai/mistral-nemo`          |
| `chat`      | `google/gemma-3-4b-it`, `meta-llama/llama-3.2-3b-instruct`, `mistralai/mistral-nemo`          |

## Timeouts and execution rules

Constants from the router (used by `createCompletionWithFallbacks` in [`providers.ts`](./providers.ts)):

| Constant                        | Value   | Meaning                                                       |
| ------------------------------- | ------- | ------------------------------------------------------------- |
| `OPENROUTER_MAX_MODELS`         | `3`     | Max models in a route chain                                   |
| `OPENROUTER_ATTEMPTS_PER_MODEL` | `1`     | No same-model retry by default (free queues are costly)       |
| `OPENROUTER_REQUEST_TIMEOUT_MS` | `35000` | Per-model HTTP timeout (overridable via env of the same name) |

On OpenRouter:

- **429 / 504** → skip immediately to the next model.
- **Privacy / ZDR / data-policy** blocks → skip to next model.
- Empty non-stream response → treat as failure and move on (with the attempt budget).

Route metadata uses strategy id `quality_first_retry_fallback` (historical name; chains are **speed-first free** today).

## How to verify

**Unit tests** (routing rules, free-only default, paid env gate):

```bash
npx tsx --test src/lib/ai/openRouterRouter.test.ts
```

**Production / staging smoke** (with `AI_PROVIDER=OPENROUTER` and `OPENROUTER_API_KEY` set):

1. Hit a script or chat completion path; response should return in tens of seconds, not multi-minute free-queue hangs.
2. Server logs should include `[openrouter-agent]` with `task`, `primary`, and `models`.
3. On free-endpoint pressure, expect `[openrouter] skip to next model` and eventual success on a later chain member (or paid twin if enabled).
