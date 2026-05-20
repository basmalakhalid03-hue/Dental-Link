# DentalLink

Dental lab management system (React + Express + Prisma + SQLite).

## Local development

```bash
# Server (port 5000)
cd server
npm install
npx prisma generate
npm run dev

# Client (port 5173)
cd client
npm install
npm run dev
```

## Deploy

- **GitHub:** https://github.com/basmalakhalid03-hue/Dental-Link
- **Vercel:** connect the repo or run `npx vercel --prod` from the project root.

Set these Vercel environment variables:

- `JWT_SECRET` — strong secret for auth tokens
- `DATABASE_URL` — optional on Vercel (SQLite is copied from `server/prisma/dev.db` to `/tmp` at runtime)
