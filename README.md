This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Orvia
Autonomous-company app (landing, INR pricing, dashboard, agent API). Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`; without it the API runs in demo mode.
Safety: server-only key, input validation, rate limiting, security headers/CSP, human approval for Engineering & Marketing runs.

## Deploy with your own domain
1. Push to GitHub, import the repo at vercel.com/new (free Hobby plan is fine).
2. Add `ANTHROPIC_API_KEY` under Project → Settings → Environment Variables.
3. Project → Settings → Domains → add your domain (buy one at Namecheap / GoDaddy / Cloudflare, ~₹800/yr for .com) and add the DNS records Vercel shows.

## Master model & Court
- **Master** (`/api/master`): routes a task to the best agent, runs it, flags high-stakes work.
- **Court** (`/api/court`): prosecutor / defense / jury / judge trial. Trial flow and juror roster adapted from [court-skill](https://github.com/alexyc9381/court-skill) by Alex Chen, MIT — license kept in `licenses/`.
