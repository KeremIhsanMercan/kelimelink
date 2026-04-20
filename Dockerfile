FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for psycopg2 and other tools
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY server/server_code/requirements.txt ./server/server_code/
RUN pip install --no-cache-dir -r server/server_code/requirements.txt

# Copy backend code and dataset
COPY server/server_code/ ./server/server_code/
COPY server/semantics_dataset/ ./server/semantics_dataset/

# Set environment variables
ENV CSV_PATH="/app/server/semantics_dataset/numberbatch_temiz.csv"

WORKDIR /app/server/server_code

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]