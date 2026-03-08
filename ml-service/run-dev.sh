#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="$ROOT_DIR/ml-service/.venv"
UVICORN_BIN="$VENV_DIR/bin/uvicorn"
PIP_BIN="$VENV_DIR/bin/pip"
PYTHON_BIN_DEFAULT="python3.12"
PYTHON_BIN="${ML_PYTHON_BIN:-$PYTHON_BIN_DEFAULT}"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "[ml-service] Required interpreter '$PYTHON_BIN' was not found."
  echo "[ml-service] Install Python 3.12 and re-run npm run dev."
  exit 1
fi

if [[ ! -x "$UVICORN_BIN" ]]; then
  echo "[ml-service] Python venv not ready. Bootstrapping dependencies..."
  rm -rf "$VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
  "$PIP_BIN" install -r "$ROOT_DIR/ml-service/requirements.txt"
fi

MODEL_PATH="${ML_MODEL_PATH:-$ROOT_DIR/deliverables/psych_screener_v3.joblib}"
export TABPFN_DISABLE_TELEMETRY="${TABPFN_DISABLE_TELEMETRY:-1}"
"$VENV_DIR/bin/python" "$ROOT_DIR/ml-service/resolve_runtime.py" \
  --pip-bin "$PIP_BIN" \
  --root-dir "$ROOT_DIR" \
  --model-path "$MODEL_PATH"

cd "$ROOT_DIR/ml-service"
exec "$UVICORN_BIN" app:app --host 0.0.0.0 --port 8001 --reload
