FROM python:3.12-slim

WORKDIR /app

# Copy all application files
COPY . .

# Install Python dependencies from ml-service
RUN pip install --no-cache-dir -r ml-service/requirements.txt

# Install TabPFN (specific version for model compatibility)
RUN pip install --no-cache-dir tabpfn==6.4.1

# Expose port
EXPOSE 8000

# Environment variables
ENV TABPFN_DISABLE_TELEMETRY=1
ENV ML_TABPFN_CANDIDATES=6.4.1,6.3.2,2.2.1
ENV PYTHONUNBUFFERED=1

# Set working directory to ml-service and start the application
WORKDIR /app/ml-service
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
