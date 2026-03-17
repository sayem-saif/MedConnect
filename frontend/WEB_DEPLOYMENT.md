# MedConnect Website Deployment Guide

This frontend is now web-ready and can be deployed as a static website.

## 1) Local Web Run

1. Copy `.env.example` to `.env`.
2. Set backend URL:
   - Local backend: `EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000`
3. Start web dev server:
   - `npm run web`

## 2) Production Build

1. Set `EXPO_PUBLIC_BACKEND_URL` to your public backend base URL.
   - Example: `https://api.yourdomain.com`
2. Build static site:
   - `npm run build:web`
3. Deploy the generated `dist` folder.

## 3) Hosting Options

- Netlify: publish directory `dist`
- Vercel: framework preset `Other`, output directory `dist`
- Cloudflare Pages: build command `npm run build:web`, output directory `dist`
- Any static host: upload `dist` directory

## 4) Backend Requirements

- Backend must be reachable from the public internet.
- CORS must allow frontend domain(s).
- Required auth endpoints:
  - `POST /api/auth/login`
  - `POST /api/auth/register`

## 5) Login Troubleshooting

If login fails:

1. Confirm browser can reach `<BACKEND_URL>/api/hospitals`.
2. Confirm demo user exists in database.
3. Confirm frontend env var is correct and app rebuilt.
4. Check browser network tab for request URL and response body.
