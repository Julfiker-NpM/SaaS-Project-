# Inventory + Order Manager (Web SaaS)

React + Tailwind CSS frontend with Firebase Authentication (Google) and Cloud Firestore. Matches the MVP from the project guide: dashboard metrics, product CRUD, order creation with stock updates, and customer list.

## Local development

```bash
cd inventory-manager
npm install
cp .env.example .env
# Fill in Firebase web app keys from Firebase Console → Project settings
npm run dev
```

## Firebase setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Add a **Web** app and copy the config into `.env` (see `.env.example` variable names).
3. **Authentication** → Sign-in method → enable **Google**.
4. **Firestore Database** → create database (production or test mode). For production, deploy rules from `firestore.rules` in the Firestore **Rules** tab (or use Firebase CLI).
5. **Firestore** → **Indexes** → if the app prompts for a composite index link when you open a page, use it; or deploy `firestore.indexes.json` with the Firebase CLI (`firebase deploy --only firestore:indexes`).

Collections used: `products`, `customers`, `orders`. Each document includes a `userId` field so data is scoped per signed-in user.

## Deploy

- **Vercel**: connect the repo, set the same `VITE_*` env vars, build command `npm run build`, output directory `dist`.
- **Firebase Hosting**: `npm run build`, then deploy the `dist` folder per [Firebase Hosting docs](https://firebase.google.com/docs/hosting/quickstart).

## Scripts

| Command         | Description        |
| --------------- | ------------------ |
| `npm run dev`   | Vite dev server    |
| `npm run build` | Production build   |
| `npm run preview` | Preview production build |
