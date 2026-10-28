# AI Mystery Room

AI Mystery Room turns a short premise into a fictional, fair-play detective case. Gemini analyzes the premise and generates a structured mystery. Players inspect suspects, a timeline, and simulated evidence, then submit one accusation to receive a verdict and detailed investigative report.

## Stack

- React, Vite, React Router, accessible CSS
- Express, Node.js, Zod, Helmet, rate limiting
- MongoDB with Mongoose
- Google Gemini through the official `@google/genai` SDK and Interactions API

## Requirements and setup

Use Node.js 20.19+ and MongoDB. Copy `.env.example` to `.env`, then set `GEMINI_API_KEY` and `MONGODB_URI`. Install dependencies from the repository root with `npm install`.

Run `npm run dev` to start the API on port 5000 and web client on port 5173. Open `http://localhost:5173`. The client proxies `/api` to the API in development. To create/update the demo case in MongoDB, run `npm run seed:demo`; the demo also loads from a deterministic local seed when first requested.

Build the client with `npm run build`. Run automated checks with `npm test`. The API health endpoint is `GET /api/v1/health`.

## Gemini and integrity

Gemini uses the server-side `GEMINI_API_KEY` and configurable `GEMINI_MODEL` (default `gemini-3.8-flash`). Structured output is parsed and validated with Zod before persistence. Validation checks difficulty-specific suspect/evidence counts, unique IDs, culprit and clue references, supporting clues, timeline references, and report references. The service allows at most two generation attempts, with one repair prompt, and enforces a configurable timeout.

The public case DTO excludes the culprit, solution, scenario analysis, red-herring markers, and evidence reliability. The backend owns correctness and returns the answer key only after a valid accusation. Guest session IDs are random browser session values; mysteries expire after 30 days. Generation is limited per session. Scenario text is not written to routine logs.

## API

- `GET /api/v1/health` — API and MongoDB readiness
- `GET /api/v1/demo` — deterministic playable demo case
- `POST /api/v1/mysteries` — generate from `{ scenario, difficulty, category }`
- `GET /api/v1/mysteries/:id` — sanitized public case
- `POST /api/v1/mysteries/:id/accusations` — `{ sessionId, selectedSuspectId, reasoning? }`
- `GET /api/v1/mysteries/:id/result?sessionId=...` — result recovery for the owning anonymous session

All generated cases and artifacts are fictional. The app does not analyze real evidence or make real-world accusations.
