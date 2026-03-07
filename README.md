# Cornell Health AI Intake (Frontend + Next.js Runtime Inference)

A Next.js App Router + TypeScript app that recreates the provided intake workflow and now runs `psych_screener_v2` analysis through a secure Next.js API route.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Routes

- `/medical-history` - Step 1 intake with `Health Content` and `Demographics` tabs
- `/voice-recording` - Step 2 voice recording + model analysis
- `/api/model/analyze` - Server-side inference endpoint (verbose terminal logs)
- `/review` - Step 3 placeholder for future provider/patient split

## Model artifacts

- `psych_screener_v2.joblib` - source sklearn artifact
- `psych_screener_v2_metadata.json` - thresholds/feature metadata
- `lib/ml/model-artifact.v2.json` - runtime-safe exported model used by Next.js

### Re-export model artifact

```bash
npm run model:export
```

## Notes

- No external backend is required; inference runs inside Next.js route handlers.
- Browser computes approximate acoustic features from recording and sends features (not raw audio) to the API route.
- Terminal logs include detailed risk interpretation, per-target probabilities, and top feature contributions.
- Audio blobs are still stored locally in IndexedDB (`cornell-health-ai-db`).
