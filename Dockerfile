# Stage 1: Build the frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/client
# Define build-time arguments for frontend environment variables
ARG VITE_ADSENSE_PUBLISHER_ID
ARG VITE_SITE_URL

COPY client/package*.json ./
RUN npm install
COPY client/ ./

# Set environment variables for the build process
ENV VITE_BACKEND_URL="/"
ENV VITE_ADSENSE_PUBLISHER_ID=$VITE_ADSENSE_PUBLISHER_ID
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN npm run build

# Stage 2: Build the backend and serve everything
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

# Copy built frontend from Stage 1
COPY --from=build-frontend /app/client/dist ./frontend/dist

# Set environment variables
ENV CSV_PATH="/app/server/semantics_dataset/numberbatch_temiz.csv"
ENV FRONTEND_PATH="/app/frontend/dist"

WORKDIR /app/server/server_code

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
