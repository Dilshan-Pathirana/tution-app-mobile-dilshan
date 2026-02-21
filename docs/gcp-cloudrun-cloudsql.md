# Deploy backend to Google Cloud (Cloud Run + Postgres) and build APK (EAS)

This repo is a monorepo:
- `backend/` = Node.js/Express API
- `mobile/` = Expo app

## Option 1 (cheaper): Use Supabase Postgres (recommended)

1) Create a Supabase project
2) In Supabase dashboard → **Project Settings → Database**
3) Copy the **Connection string** (use the "Direct connection" string for running migrations)

You will set it on Cloud Run as `DATABASE_URL`.

Notes:
- This backend runs migrations on startup (`npm run start:prod`). Migrations need a connection string that supports DDL.
- Keep `NODE_ENV=production` so SSL is enabled in [backend/src/database/db.js](../backend/src/database/db.js).

## Option 2 (GCP-native): Create a Cloud SQL Postgres instance

In Google Cloud Console:
- Create **Cloud SQL → PostgreSQL**
- Create a database (example: `tutorbooking`)
- Create a user (example: `appuser`)

Recommended for Cloud Run:
- Use **Private IP** if you have VPC setup
- OR use the **Cloud SQL connector** (simpler) via the Cloud Run "Connections" setting

You will need the **Instance connection name**:

`PROJECT_ID:REGION:INSTANCE_NAME`

## 2) Deploy the API to Cloud Run

Prereqs:
- Install Google Cloud SDK (`gcloud`)
- Authenticate and select a project

```powershell
gcloud auth login
gcloud config set project <PROJECT_ID>

# If you see a "Billing must be enabled" error when enabling services, link a billing account:
#   gcloud billing accounts list
#   gcloud billing projects link <PROJECT_ID> --billing-account=<BILLING_ACCOUNT_ID>

gcloud services enable run.googleapis.com cloudbuild.googleapis.com sqladmin.googleapis.com
```

### Deploy from the `backend/` source (recommended)

This uses Google Cloud buildpacks and does not require Docker locally.

```powershell
gcloud run deploy tutorbooking-api `
  --source backend `
  --region asia-southeast1 `
  --allow-unauthenticated
```

### Option B: Deploy using the included Dockerfile

Build an image with Cloud Build, then deploy that image:

```powershell
gcloud builds submit backend --tag gcr.io/<PROJECT_ID>/tutorbooking-api

gcloud run deploy tutorbooking-api `
  --image gcr.io/<PROJECT_ID>/tutorbooking-api `
  --region asia-southeast1 `
  --allow-unauthenticated
```

## 3) Set env vars on Cloud Run

In Cloud Run service → **Edit & deploy new revision**:

### Environment variables
Set these (do not commit secrets):
- `NODE_ENV=production`
- `JWT_SECRET=<generate a long random value>`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=*` (or your exact origin)

#### DATABASE_URL (Supabase)

Set `DATABASE_URL` to the Supabase Postgres connection string.

Example format:

`postgresql://postgres:YOUR_PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres`

#### DATABASE_URL (Cloud SQL over Unix socket)

Set `DATABASE_URL` like this:

`postgresql://USER:PASSWORD@/DBNAME?host=/cloudsql/INSTANCE_CONNECTION_NAME`

Example:

`postgresql://appuser:YOUR_PASSWORD@/tutorbooking?host=/cloudsql/my-project:asia-southeast1:tutorbooking-db`

Optional (only if you use these features):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT` (base64-encoded service account JSON)

## 4) Verify the API

After deploy, open:
- `https://<your-cloud-run-url>/api/health`

## 5) Point the Expo app at Cloud Run and build an APK with EAS

Your mobile app reads the API from `EXPO_PUBLIC_API_URL`.

### Set the production API URL

Update the `production.env.EXPO_PUBLIC_API_URL` in `mobile/eas.json` to:

`https://<your-cloud-run-url>/api`

### Build APK

```powershell
cd mobile
npm install
npm install -g eas-cli
eas login
eas build -p android --profile preview-apk
```

When the build finishes, EAS gives you a download link for the APK.

## Important note about push notifications

Mobile currently registers an **Expo push token** (looks like `ExponentPushToken[...]`).
Backend currently tries to send via **Firebase Admin (FCM)**.

That combination will not send push notifications successfully unless you either:
- Change backend to send via **Expo Push API**, or
- Change mobile to register an **FCM device token** and store that in `users.push_token`.
