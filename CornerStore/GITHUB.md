# Publishing to GitHub (secrets-safe)

This repo is configured so **real API keys never go to GitHub**. Keep secrets only in local files that are gitignored.

## 1. Create your local env files (never commit these)

```bash
# From CornerStore/
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit each file and add your real values:

| Variable | Where to get it |
|----------|-----------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/api-keys) |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same Stripe page (publishable key) |
| `JWT_OPTIONS__SECRET_KEY` | Generate a long random string |

## 2. Files that stay OUT of Git

- `CornerStore/.env`
- `CornerStore/backend/.env`
- `CornerStore/frontend/.env.local`
- Any `*.env` except `*.env.example`

## 3. Before you push

From the repo root:

```powershell
.\scripts\check-secrets.ps1
```

If it reports problems, fix them before `git push`.

## 4. If GitHub still blocks the push

Older commits may still contain leaked keys. **Rotate** any Stripe/Gemini keys that were ever committed, then scrub history:

```powershell
.\scripts\scrub-git-history.ps1
git push --force-with-lease origin main
```

Only force-push if you understand it rewrites remote history.

## 5. Safe defaults in the repo

- `*.env.example` — placeholders only
- `appsettings.Development.json` — no real Stripe/Gemini keys
- `docker-compose.yml` — reads secrets from `.env`, no hardcoded keys
