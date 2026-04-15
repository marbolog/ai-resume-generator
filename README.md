# AI Resume Generator

Pay-per-use SaaS that generates ATS-optimized resumes and cover letters using Claude AI, with Stripe payments and instant PDF download. Available in **Italian and English**.

## Pricing

| Product | Price |
|---|---|
| Solo CV / Resume only | €1,99 / $1.99 |
| Solo Lettera / Cover letter only | €1,99 / $1.99 |
| CV + Lettera / Resume + Cover letter | €2,99 / $2.99 |

## Stack

- **Backend**: Python · FastAPI · Anthropic Claude API · Stripe · ReportLab
- **Frontend**: Vanilla HTML/CSS/JS · Stripe.js
- **Environment**: [uv](https://docs.astral.sh/uv/)
- **Hosting**: [Fly.io](https://fly.io) (Frankfurt region)
- **CI/CD**: GitHub Actions → auto-deploy on push to `master`

---

## Local development

### 1. Install uv (if not already installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Clone & install

```bash
git clone https://github.com/marbolog/ai-resume-generator.git
cd ai-resume-generator
uv sync --no-install-project
```

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your keys:
#   ANTHROPIC_API_KEY       → https://console.anthropic.com
#   STRIPE_SECRET_KEY       → https://dashboard.stripe.com/apikeys
#   STRIPE_PUBLISHABLE_KEY  → https://dashboard.stripe.com/apikeys
```

### 4. Run

```bash
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open [http://localhost:8000](http://localhost:8000).
Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.

---

## Production deployment (Fly.io)

### First deploy — run once

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Log in
fly auth login

# 3. Create the app (reads fly.toml, skip the Postgres/Redis prompts)
fly launch --name marbolog-ai-resume-generator --no-deploy

# 4. Set secrets (never committed to git)
fly secrets set \
  ANTHROPIC_API_KEY="sk-ant-..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_PUBLISHABLE_KEY="pk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..."

# 5. Deploy
fly deploy
```

Your app will be live at `https://marbolog-ai-resume-generator.fly.dev`.

### Wire up CI/CD (GitHub Actions)

After the first deploy, every `git push` to `master` will auto-deploy:

```bash
# Generate a deploy token
fly tokens create deploy -x 999999h

# Add it to GitHub repository secrets as FLY_API_TOKEN:
# https://github.com/marbolog/ai-resume-generator/settings/secrets/actions
```

CI/CD pipeline: `.github/workflows/deploy.yml`
- Triggers on push to `master`
- Builds Docker image on Fly's remote builder (no local Docker needed)
- Zero-downtime deploy via rolling update

### Useful commands

```bash
fly status                  # machine health
fly logs                    # live log tail
fly ssh console             # shell into the running container
fly secrets list            # list configured secrets (values hidden)
fly scale count 1           # ensure exactly 1 machine running
```

---

## Architecture

```
GitHub push
    │
    ▼
GitHub Actions (deploy.yml)
    │  flyctl deploy --remote-only
    ▼
Fly.io remote builder
    │  docker build
    ▼
Fly.io Frankfurt (fra)
    │  HTTPS (auto-cert)
    ▼
FastAPI app (port 8080)
    ├── GET  /              → static/index.html
    ├── GET  /health        → health check
    ├── GET  /api/config    → Stripe publishable key
    ├── POST /api/create-payment-intent
    └── POST /api/generate  → Claude API → PDF
```
