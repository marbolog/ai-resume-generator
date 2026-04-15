# AI Resume Generator

Pay-per-use SaaS that generates ATS-optimized resumes and cover letters using Claude AI, with Stripe payments and instant PDF download.

## Pricing

| Product | Price |
|---|---|
| Resume only | $1.99 |
| Cover letter only | $1.99 |
| Resume + Cover letter | $2.99 |

## Stack

- **Backend**: Python · FastAPI · Anthropic Claude API · Stripe · ReportLab
- **Frontend**: Vanilla HTML/CSS/JS · Stripe.js

## Setup

### 1. Clone & install

```bash
git clone https://github.com/marbolog/ai-resume-generator.git
cd ai-resume-generator
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your keys:
#   ANTHROPIC_API_KEY  → https://console.anthropic.com
#   STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY → https://dashboard.stripe.com/apikeys
```

### 3. Run

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open [http://localhost:8000](http://localhost:8000).

### 4. Stripe test card

Use card `4242 4242 4242 4242`, any future expiry, any CVC.

## Deployment (Raspberry Pi / VPS)

```bash
# Run as a systemd service or with:
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Expose via Nginx reverse proxy and add HTTPS with Let's Encrypt for production.

## Monetization tips

- List on Gumroad or your own domain
- Target job seekers on Reddit (r/jobs, r/cscareerquestions)
- Offer a free tier (watermarked PDF) to build trust
