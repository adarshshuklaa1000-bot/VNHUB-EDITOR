# VN HUB — GitHub + Vercel

## Features
- Public template library
- Owner-only dashboard
- Password protected dashboard
- Real template image upload
- Real VN QR image upload
- VN code storage
- Add / Edit / Delete
- Vercel Blob storage
- Data persists online
- Mobile responsive

## Deploy

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. In Vercel open Storage → Create Database → Blob.
4. Create a **Public** Blob store because template images and QR images must be viewable by visitors.
5. Vercel will add `BLOB_READ_WRITE_TOKEN` to the project environment.
6. Add these Environment Variables in Vercel:
   - `ADMIN_PASSWORD` = your private dashboard password
   - `ADMIN_SESSION_SECRET` = a long random secret, e.g. `change-this-to-a-long-random-value-...`
7. Redeploy.

The website uses `/api/auth`, `/api/templates`, and `/api/blob-upload`.

## Important
Do not put `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` in `index.html`.
Do not commit a `.env` file containing these values.

The public media files are stored in Vercel Blob. The template metadata is stored in a private Blob JSON file and is only read/written by the server.

## Local development
Run:
npm install
npx vercel dev

For local Blob/auth behavior, connect the project to Vercel and pull environment variables with:
vercel env pull .env.local
VNHUB deployment update
