# Decisions

- Use the Google `@google/genai` SDK Interactions API because Google's current Gemini documentation recommends it for new integrations. The model is selected with `GEMINI_MODEL`, defaulting to the stable Gemini 3.8 Flash model documented at implementation time.
- Use JavaScript ES modules across client and server to keep setup approachable while Zod provides runtime-safe data contracts.
- Keep an anonymous session ID in browser session storage. No account or personal profile data is required for the MVP.
- Store solution and case-analysis report fields in the private MongoDB mystery document; sanitize these fields from all pre-accusation responses.
- Seed a deterministic fictional demo so the core gameplay is available without Gemini credentials.
