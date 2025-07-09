#!/bin/bash

# Google Cloud deployment script for Allyanas Restaurant
# Make sure you're logged in: gcloud auth login
# Make sure project is set: gcloud config set project allyanas-llc

echo "🚀 Starting deployment to Google Cloud..."

# Set project and region
PROJECT_ID="allyanas-llc"
REGION="asia-southeast1"
SERVICE_NAME="restaurant-frontend"

echo "📋 Project: $PROJECT_ID"
echo "🌏 Region: $REGION"

# Set the project
gcloud config set project $PROJECT_ID

# Build and deploy frontend to Cloud Run
echo "🏗️  Building and deploying frontend..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --port 80 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300

# Deploy Cloud Function for payment processing
echo "💳 Deploying payment processing function..."
cd functions
gcloud functions deploy processPayment \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region $REGION \
  --memory 256MB \
  --timeout 60s \
  --set-env-vars PAYMONGO_SECRET_KEY=YOUR_SECRET_KEY_HERE,PAYMONGO_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE

cd ..

echo "✅ Deployment completed!"
echo "🌐 Frontend URL: https://$SERVICE_NAME-$(gcloud config get-value core/account | cut -d'@' -f1 | tr -d '.')-$PROJECT_ID.$REGION.run.app"
echo "💳 Payment Function URL: https://$REGION-$PROJECT_ID.cloudfunctions.net/processPayment" 