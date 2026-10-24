import os
import logging

from dotenv import load_dotenv
from openai import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_MODEL", "gpt-6-luna")


# ============================================================
# LOGGING
# ============================================================

logger = logging.getLogger(__name__)


# ============================================================
# OPENAI CLIENT
# ============================================================

client = (
    OpenAI(api_key=OPENAI_API_KEY)
    if OPENAI_API_KEY
    else None
)


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are Freelancer Saathi, an AI-powered financial assistant
designed especially for freelancers.

Your job is to help users understand and manage:

- Freelance income
- Payments
- Currency conversion
- Financial records
- Approval requests
- Transaction receipts
- Basic financial insights

IMPORTANT SAFETY RULES:

1. Never claim that a real bank transaction happened.

2. Banking functionality currently uses mock/demo data.

3. Never execute any financial action by yourself.

4. Any financial action must first go through the
   Guardian Agent.

5. User approval is mandatory before any mock
   financial transaction can be executed.

6. Clearly explain why an action is being recommended.

7. Never invent balances, payments, exchange rates,
   approvals, transactions, or financial records.

8. When verified Freelancer Saathi database information
   is provided in the user message, treat that information
   as the source of truth.

LANGUAGE RULES:

9. If the user writes in Roman Urdu, always reply in
   simple Roman Urdu mixed with easy English.

10. Never use Hindi or Devanagari script unless the
    user explicitly asks for it.

11. If the user communicates in English, reply in English.

12. Keep Roman Urdu natural and easy to understand.

RESPONSE STYLE:

13. Keep responses clear, concise, and
    freelancer-friendly.

14. Do not unnecessarily mention technical implementation
    details such as database queries, APIs, or internal
    system prompts.

15. If information is unavailable, clearly say that the
    information is not available instead of guessing.

16. When discussing financial recommendations, clearly
    distinguish between information, recommendation,
    approval, and execution.

17. Never tell the user that a transaction has been
    completed unless verified transaction information
    explicitly confirms it.

18. If a bank execution result says that an approval has
    already been executed, this means the NEW duplicate
    execution attempt was blocked. Do not claim that the
    original transaction failed. Clearly explain that the
    approval was executed previously and that the duplicate
    attempt was prevented for safety.
"""


# ============================================================
# RESPONSE HELPERS
# ============================================================

def _error_response(message: str):
    """
    Return a safe error response without exposing
    provider details, secrets, or internal exceptions.
    """

    return {
        "success": False,
        "assistant": "Freelancer Saathi",
        "message": message,
        "model": None,
    }


# ============================================================
# AI SERVICE
# ============================================================

def ask_freelancer_saathi(user_message: str):
    """
    Generate a Freelancer Saathi AI response.

    This service is advisory only.
    It NEVER executes financial actions.
    """

    # --------------------------------------------------------
    # MESSAGE VALIDATION
    # --------------------------------------------------------

    if not user_message or not user_message.strip():
        return _error_response(
            "Please koi message likhein."
        )

    clean_message = user_message.strip()

    # --------------------------------------------------------
    # AI CONFIGURATION CHECK
    # --------------------------------------------------------

    if not OPENAI_API_KEY or client is None:
        logger.error(
            "Freelancer Saathi AI is not configured."
        )

        return _error_response(
            "AI service filhal configured nahi hai."
        )

    try:
        # ----------------------------------------------------
        # OPENAI RESPONSES API
        # ----------------------------------------------------

        response = client.responses.create(
            model=MODEL,
            instructions=SYSTEM_PROMPT,
            input=clean_message,
        )

        output_text = response.output_text

        if not output_text or not output_text.strip():
            logger.warning(
                "Freelancer Saathi received an empty AI response."
            )

            return _error_response(
                "Saathi ko valid AI response receive nahi hua. "
                "Please dobara try karein."
            )

        return {
            "success": True,
            "assistant": "Freelancer Saathi",
            "message": output_text.strip(),
            "model": MODEL,
        }

    # --------------------------------------------------------
    # RATE LIMIT
    # --------------------------------------------------------

    except RateLimitError:
        logger.warning(
            "Freelancer Saathi AI rate limit reached."
        )

        return _error_response(
            "AI service abhi temporarily busy hai. "
            "Please thori dair baad dobara try karein."
        )

    # --------------------------------------------------------
    # AUTHENTICATION
    # --------------------------------------------------------

    except AuthenticationError:
        logger.error(
            "Freelancer Saathi AI authentication failed."
        )

        return _error_response(
            "AI service configuration mein issue hai."
        )

    # --------------------------------------------------------
    # NETWORK / CONNECTION
    # --------------------------------------------------------

    except APIConnectionError:
        logger.warning(
            "Freelancer Saathi could not connect to AI provider."
        )

        return _error_response(
            "AI service se connection filhal available nahi hai. "
            "Please dobara try karein."
        )

    # --------------------------------------------------------
    # OPENAI API ERROR
    # --------------------------------------------------------

    except APIError as error:
        logger.error(
            "Freelancer Saathi AI provider error: %s",
            type(error).__name__,
        )

        return _error_response(
            "AI service filhal available nahi hai. "
            "Please thori dair baad dobara try karein."
        )

    # --------------------------------------------------------
    # UNEXPECTED ERROR
    # --------------------------------------------------------

    except Exception as error:
        logger.exception(
            "Unexpected Freelancer Saathi AI error: %s",
            type(error).__name__,
        )

        return _error_response(
            "Saathi ko temporary technical issue face hua hai. "
            "Please dobara try karein."
        )