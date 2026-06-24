import os
from pathlib import Path
import cohere
from dotenv import load_dotenv

# Load .env from the project root (one level up from backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

# ── Startup diagnostic ──────────────────────────────────────────────────────
_api_key = os.getenv("COHERE_API_KEY", "")
if not _api_key:
    print("[ERROR] COHERE_API_KEY is not set. Check your .env file at:", _env_path)
else:
    print(f"[OK] COHERE_API_KEY loaded (starts with: {_api_key[:8]}...)")
# ───────────────────────────────────────────────────────────────────────────

REPORT_STYLES = {
    "academic":     "formal academic style with citations, literature review tone, and scholarly language",
    "business":     "professional business style with executive summary, clear KPIs, and action-oriented language",
    "technical":    "technical documentation style with specifications, diagrams descriptions, and precise terminology",
    "journalistic": "journalistic style with an inverted pyramid structure, engaging narrative, and factual tone",
    "summary":      "concise summary style with bullet points, key takeaways, and minimal prose",
}

REPORT_LENGTHS = {
    "short":  "approximately 300–400 words",
    "medium": "approximately 700–900 words",
    "long":   "approximately 1400–1600 words",
}


def build_prompt(topic: str, notes: str, style: str, length: str) -> str:
    style_desc  = REPORT_STYLES.get(style, REPORT_STYLES["business"])
    length_desc = REPORT_LENGTHS.get(length, REPORT_LENGTHS["medium"])

    notes_section = f"\n\nAdditional notes / raw data to incorporate:\n{notes}" if notes.strip() else ""

    return f"""You are an expert report writer. Generate a complete, professional report in {style_desc}.

Topic: {topic}{notes_section}

Target length: {length_desc}

Structure the report with these clearly labeled sections using markdown headings:
1. **Executive Summary** – A concise overview of the report
2. **Introduction** – Context, background, and purpose
3. **Main Body** – In-depth analysis divided into 2–4 relevant sub-sections with ## headings
4. **Key Findings** – Bullet-point list of the most important insights
5. **Conclusion** – Summary and closing thoughts
6. **Recommendations** – 3–5 actionable recommendations

Rules:
- Use proper markdown formatting (headings, bullets, bold)
- Do NOT include a title at the top; the title will be added separately
- Keep language {style_desc}
- Make content specific, insightful, and substantive — not generic filler
- Ensure every section flows logically into the next"""


def generate_report(topic: str, notes: str, style: str, length: str) -> dict:
    # Build the client fresh each call so it always uses the current env value
    api_key = os.getenv("COHERE_API_KEY", "")
    if not api_key:
        return {
            "success": False,
            "error": "COHERE_API_KEY is not set. Add it to your .env file and restart the server.",
        }

    try:
        client = cohere.ClientV2(api_key=api_key)
        prompt = build_prompt(topic, notes, style, length)

        response = client.chat(
            model="command-a-03-2025",
            messages=[
                {"role": "user", "content": prompt}
            ],
        )
        report_text = response.message.content[0].text

        return {
            "success": True,
            "topic":   topic,
            "style":   style,
            "length":  length,
            "report":  report_text,
        }

    except Exception as e:
        err_str = str(e)
        # Provide a friendlier message for common API errors
        if "429" in err_str or "rate limit" in err_str.lower():
            friendly = (
                "Your Cohere API key has exceeded its rate limit. "
                "Please wait a moment and try again, or check your plan at "
                "https://dashboard.cohere.com"
            )
        elif "401" in err_str or "unauthorized" in err_str.lower() or "invalid api key" in err_str.lower():
            friendly = (
                "Your Cohere API key is invalid or has been revoked. "
                "Get a new one at https://dashboard.cohere.com/api-keys and update your .env file."
            )
        else:
            friendly = err_str
        return {
            "success": False,
            "error": friendly,
        }
