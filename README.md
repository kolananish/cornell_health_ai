# Cornell Health AI Intake (Next.js + v3 Python Model Service)

This app implements a two-step intake flow and runs the `/deliverables` **v3 PHQ screener** model (`psych_screener_v3.joblib`) through a Python FastAPI service.

## Architecture

- **Frontend/UI**: Next.js App Router + TypeScript
- **Model execution**: Python FastAPI (`ml-service/`)
- **Audio processing**: librosa (server-side)
- **Model artifact**: `deliverables/psych_screener_v3.joblib` + `deliverables/psych_models.py`
- **Next.js API route**: `/api/model/analyze` proxies multipart requests to the Python service

## Run locally

### One-time setup (Python 3.12 recommended)

```bash
npm install
npm run setup:ml
```

`npm run setup:ml` is optional now because `npm run dev` can auto-bootstrap `ml-service/.venv` when missing.
By default, scripts use `python3.12` for the ML venv.
`npm run setup:ml` now also runs a model-load probe and resolves a compatible TabPFN runtime.

On startup, the ML service runs a compatibility probe against
`deliverables/psych_screener_v3.joblib`. If current dependencies cannot load the
artifact, it automatically tries a curated set of TabPFN versions and selects the
first one that successfully loads the model.

### Start both app + model service (one command)

```bash
npm run dev
```

Open `http://localhost:3000`.

`npm run dev` starts:
- Next.js frontend
- Python FastAPI model service on `http://localhost:8001`
- and clears stale `.next` cache automatically to avoid chunk-mismatch dev errors

## Routes

- `/medical-history` - Step 1 intake with Health Content + Demographics tabs
- `/voice-recording` - Step 2 two-task recording + v3 PHQ analysis
- `/api/model/analyze` - Next.js proxy to Python model service
- `/review` - Step 3 placeholder

## v3 voice requirements

The model expects:

1. **Rainbow Passage** recording (target 30-45 seconds)
2. **Free Speech** recording (target 30-45 seconds)
3. Metadata: age, sex field, education level, psych-history binary flags

The frontend converts recordings to WAV before upload so librosa can process them reliably.

## Threshold modes

- `balanced` (default)
- `high_sensitivity`

The service reads thresholds from the loaded model bundle and returns both values in each response.

## Notes

- Model inference logs are verbose in the ML service terminal.
- This is decision support, not diagnosis.

## Troubleshooting

If you see `Cannot find module './<chunk>.js'` from `.next/server/webpack-runtime.js`:

1. Stop the dev process.
2. Run `rm -rf .next`.
3. Run `npm run dev` again.

If ML startup fails with `ModuleNotFoundError: No module named 'tabpfn.architectures'`:

1. Stop dev.
2. Run `rm -rf ml-service/.venv`.
3. Run `npm run dev` again to recreate and auto-resolve a compatible ML runtime.

If you need to override candidate TabPFN versions, set:

`ML_TABPFN_CANDIDATES=6.4.1,6.3.2,2.2.1,...`
