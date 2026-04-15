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

## Setup

### 1. Install uv (if not already installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Clone & install

```bash
git clone https://github.com/marbolog/ai-resume-generator.git
cd ai-resume-generator
uv sync
```

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your keys:
#   ANTHROPIC_API_KEY  → https://console.anthropic.com
#   STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY → https://dashboard.stripe.com/apikeys
```

### 4. Run

```bash
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open [http://localhost:8000](http://localhost:8000).

### 5. Stripe test card

Use card `4242 4242 4242 4242`, any future expiry, any CVC.

## Deployment (Raspberry Pi / VPS)

```bash
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Expose via Nginx reverse proxy and add HTTPS with Let's Encrypt for production.

## Monetization tips

- List on Gumroad or your own domain
- Target job seekers on Reddit / LinkedIn Italia
- Offer a free watermarked PDF to build trust
