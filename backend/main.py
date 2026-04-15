import os
import io
import stripe
import anthropic

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .pdf import build_pdf

load_dotenv()

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
PRICE_CENTS = int(os.environ.get("PRICE_CENTS", "299"))  # $2.99 default

claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

app = FastAPI(title="AI Resume Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/config")
def config():
    return {"stripe_publishable_key": os.environ["STRIPE_PUBLISHABLE_KEY"]}


# ── Pydantic models ──────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    job_title: str
    years_experience: int
    skills: str          # comma-separated
    work_history: str    # free text
    target_role: str
    job_description: str
    doc_type: str        # "resume" | "cover_letter" | "both"
    payment_intent_id: str
    language: str = "it" # "it" | "en"


class CheckoutRequest(BaseModel):
    doc_type: str        # "resume" | "cover_letter" | "both"


# ── Stripe: create payment intent ────────────────────────────────────────────

PRICES = {"resume": 199, "cover_letter": 199, "both": 299}


@app.post("/api/create-payment-intent")
async def create_payment_intent(body: CheckoutRequest):
    amount = PRICES.get(body.doc_type, 299)
    intent = stripe.PaymentIntent.create(
        amount=amount,
        currency="usd",
        automatic_payment_methods={"enabled": True},
        metadata={"doc_type": body.doc_type},
    )
    return {"client_secret": intent.client_secret, "amount": amount}


# ── Generate document(s) ─────────────────────────────────────────────────────

@app.post("/api/generate")
async def generate(body: GenerateRequest):
    # Verify payment succeeded
    try:
        intent = stripe.PaymentIntent.retrieve(body.payment_intent_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if intent.status != "succeeded":
        raise HTTPException(status_code=402, detail="Payment not completed")

    resume_text = ""
    cover_letter_text = ""

    if body.doc_type in ("resume", "both"):
        resume_text = _generate_resume(body)

    if body.doc_type in ("cover_letter", "both"):
        cover_letter_text = _generate_cover_letter(body)

    pdf_bytes = build_pdf(
        full_name=body.full_name,
        email=body.email,
        phone=body.phone,
        resume_text=resume_text,
        cover_letter_text=cover_letter_text,
        doc_type=body.doc_type,
    )

    filename = f"{body.full_name.replace(' ', '_')}_{body.doc_type}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Claude helpers ───────────────────────────────────────────────────────────

_LANG_INSTRUCTIONS = {
    "it": "Write the entire document in Italian (italiano). Use formal Italian register (Lei form where applicable).",
    "en": "Write the entire document in English.",
}

_RESUME_HEADERS = {
    "it": "Use SOMMARIO, ESPERIENZA, COMPETENZE, FORMAZIONE as section headers (uppercase Italian).",
    "en": "Use SUMMARY, EXPERIENCE, SKILLS, EDUCATION as section headers (uppercase).",
}

_COVER_SALUTATION = {
    "it": 'Start with "Gentile Responsabile delle Risorse Umane,"',
    "en": 'Start with "Dear Hiring Manager,"',
}


def _generate_resume(req: GenerateRequest) -> str:
    lang_instr  = _LANG_INSTRUCTIONS.get(req.language, _LANG_INSTRUCTIONS["it"])
    header_instr = _RESUME_HEADERS.get(req.language, _RESUME_HEADERS["it"])

    prompt = f"""You are an expert resume writer. Create a professional, ATS-optimized resume.

Candidate details:
- Name: {req.full_name}
- Email: {req.email}
- Phone: {req.phone}
- Current/most recent title: {req.job_title}
- Years of experience: {req.years_experience}
- Skills: {req.skills}
- Work history: {req.work_history}
- Target role: {req.target_role}

Job description they are applying to:
{req.job_description}

Instructions:
- {lang_instr}
- Write in a clean, professional format using plain text with clear section headers
- {header_instr}
- Tailor bullet points to match keywords from the job description
- Use strong action verbs and quantify achievements where possible
- Keep it to one page worth of content
- Do NOT include any commentary — output only the resume text"""

    message = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def _generate_cover_letter(req: GenerateRequest) -> str:
    lang_instr   = _LANG_INSTRUCTIONS.get(req.language, _LANG_INSTRUCTIONS["it"])
    salutation   = _COVER_SALUTATION.get(req.language, _COVER_SALUTATION["it"])

    prompt = f"""You are an expert career coach. Write a compelling, personalized cover letter.

Candidate details:
- Name: {req.full_name}
- Email: {req.email}
- Current/most recent title: {req.job_title}
- Years of experience: {req.years_experience}
- Key skills: {req.skills}
- Work history summary: {req.work_history}
- Target role: {req.target_role}

Job description:
{req.job_description}

Instructions:
- {lang_instr}
- Write 3–4 paragraphs: hook, relevant experience, why this company/role, call to action
- Tone: confident, enthusiastic, professional
- Do NOT include any commentary — output only the cover letter text
- {salutation}
- End with a professional sign-off including the candidate's name"""

    message = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text
