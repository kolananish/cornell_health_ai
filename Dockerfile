FROM python:3.12-slim

WORKDIR /app

# Copy requirements
COPY ml-service/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY ml-service/ .
COPY deliverables/ ../deliverables/

# Expose port
EXPOSE 8000

# Environment variables
ENV TABPFN_DISABLE_TELEMETRY=1
ENV ML_TABPFN_CANDIDATES=6.4.1,6.3.2,2.2.1

# Run the application
CMD ["sh", "-c", "python resolve_runtime.py --pip-bin /usr/local/bin/pip --root-dir /app/.. --model-path /app/../deliverables/psych_screener_v3.joblib && uvicorn app:app --host 0.0.0.0 --port 8000"]
