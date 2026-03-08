# ML Service (v3 PHQ Screener)

This service runs the `deliverables/psych_screener_v3.joblib` model using Python, librosa, and FastAPI.

## Endpoints

- `GET /healthz`
- `POST /v1/analyze/phq`

`POST /v1/analyze/phq` expects multipart form-data:

- `rainbow_audio`: WAV audio file
- `free_speech_audio`: WAV audio file
- `metadata`: JSON string with model metadata fields

## Run locally

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python resolve_runtime.py --pip-bin .venv/bin/pip --root-dir .. --model-path ../deliverables/psych_screener_v3.joblib
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

When started through `npm run dev`, `run-dev.sh` also runs a compatibility
resolver that verifies `psych_screener_v3.joblib` can be loaded and, if needed,
reinstalls a compatible `tabpfn` version automatically.

## Environment variables

- `ML_MODEL_PATH` (optional): override default model file path.
- `ML_TABPFN_CANDIDATES` (optional): comma-separated TabPFN versions to try
  during runtime auto-resolution.

Default model path:

`../deliverables/psych_screener_v3.joblib`
