# Stage 1: Build the React frontend
FROM node:20 AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# Use relative paths for API calls in the build
RUN npm run build

# Stage 2: Final image with Python backend and built frontend
FROM python:3.11-slim

# Set up user 1000 for Hugging Face Spaces compatibility
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install system dependencies (require root)
USER root
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*
USER user

# Copy backend requirements and install
COPY --chown=user server/server_code/requirements.txt ./server/server_code/
RUN pip install --no-cache-dir --user -r server/server_code/requirements.txt

# Copy backend code and dataset
COPY --chown=user server/server_code/ ./server/server_code/
COPY --chown=user server/semantics_dataset/ ./server/semantics_dataset/

# Copy built frontend from Stage 1 into the backend's static directory
COPY --chown=user --from=frontend-builder /app/client/dist ./server/server_code/static

# Set environment variables
ENV CSV_PATH="/home/user/app/server/semantics_dataset/numberbatch_temiz.csv"
ENV PYTHONUNBUFFERED=1

WORKDIR $HOME/app/server/server_code

# Hugging Face Spaces defaults to port 7860
EXPOSE 7860

# Run the application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]