"""PDF generation using reportlab."""
from io import BytesIO
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER


def build_pdf(
    full_name: str,
    email: str,
    phone: str,
    resume_text: str,
    cover_letter_text: str,
    doc_type: str,
) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "Name",
        parent=styles["Normal"],
        fontSize=18,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    contact_style = ParagraphStyle(
        "Contact",
        parent=styles["Normal"],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#555555"),
        spaceAfter=8,
    )
    section_header_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1a1a2e"),
        spaceBefore=10,
        spaceAfter=2,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=14,
        spaceAfter=4,
    )

    story = []

    def add_header():
        story.append(Paragraph(full_name, name_style))
        story.append(Paragraph(f"{email}  ·  {phone}", contact_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1a1a2e")))
        story.append(Spacer(1, 6))

    def add_text_block(text: str):
        for line in text.split("\n"):
            stripped = line.strip()
            if not stripped:
                story.append(Spacer(1, 4))
                continue
            # Detect section headers (all-caps words like SUMMARY, EXPERIENCE…)
            if stripped.isupper() and len(stripped.split()) <= 4:
                story.append(Paragraph(stripped, section_header_style))
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
            elif stripped.startswith("•") or stripped.startswith("-"):
                story.append(Paragraph(stripped.lstrip("-•").strip(), body_style,
                                       bulletText="•"))
            else:
                story.append(Paragraph(stripped, body_style))

    if doc_type in ("resume", "both"):
        add_header()
        add_text_block(resume_text)

    if doc_type == "both":
        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a1a2e")))
        story.append(Spacer(1, 10))
        story.append(Paragraph("COVER LETTER", section_header_style))
        story.append(Spacer(1, 8))
        add_text_block(cover_letter_text)
    elif doc_type == "cover_letter":
        add_header()
        add_text_block(cover_letter_text)

    doc.build(story)
    return buf.getvalue()
