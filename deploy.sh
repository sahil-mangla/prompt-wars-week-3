#!/bin/bash
set -e

# Configuration
PROJECT_ID="habitloop-carbon"
REGION="us-central1"
SERVICE_NAME="habitloop"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "===================================================="
echo "🚀 Starting Deployment of HabitLoop to Cloud Run"
echo "===================================================="

# 1. Ensure gcloud is set to the correct project
echo "Step 1: Setting active GCP project to: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

# 2. Check and Create Secrets in Secret Manager if they don't exist
echo "Step 2: Checking GCP Secret Manager configuration..."

ensure_secret() {
  local secret_name=$1
  if ! gcloud secrets describe "${secret_name}" &>/dev/null; then
    echo "  Creating secret: ${secret_name}..."
    gcloud secrets create "${secret_name}" --replication-policy="automatic"
  else
    echo "  Secret '${secret_name}' already exists."
  fi
}

ensure_secret "gemini-api-key"
ensure_secret "firebase-service-account"

# 3. Upload local service-account.json to Secret Manager if found
if [ -f "backend/service-account.json" ]; then
  echo "Found local backend/service-account.json. Uploading to Secret Manager..."
  gcloud secrets versions add firebase-service-account --data-file="backend/service-account.json"
else
  echo "⚠️  backend/service-account.json not found locally. Ensure 'firebase-service-account' secret is already populated in Secret Manager."
fi

# 4. Build and Push Container using Cloud Build
echo "Step 3: Building and pushing container using Cloud Build..."
gcloud builds submit --tag "${IMAGE_TAG}"

# 5. Grant Secret Accessor Role to Cloud Run Service Account
echo "Step 4: Granting Secret Manager Access to Cloud Run..."
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 6. Deploy to Google Cloud Run
echo "Step 5: Deploying to Google Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_TAG}" \
  --platform managed \
  --region "${REGION}" \
  --set-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --update-secrets=/secrets/service-account.json=firebase-service-account:latest \
  --set-env-vars=GOOGLE_APPLICATION_CREDENTIALS=/secrets/service-account.json \
  --allow-unauthenticated

echo "===================================================="
echo "✨ Deployment Complete!"
echo "===================================================="
