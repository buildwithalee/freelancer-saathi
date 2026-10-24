from typing import Dict


# Mock exchange-rate data for demo purposes.
# Later this can be replaced with a real or sandbox FX API.
MOCK_CURRENT_RATE = 282.50
MOCK_30_DAY_AVERAGE = 279.20


def get_fx_advice() -> Dict:
    current_rate = MOCK_CURRENT_RATE
    average_rate = MOCK_30_DAY_AVERAGE

    difference = current_rate - average_rate
    percentage_difference = (difference / average_rate) * 100

    if percentage_difference >= 1:
        recommendation = "CONSIDER_CONVERTING"
        message = (
            "Aaj ka USD/PKR rate 30-day average se behtar hai. "
            "Agar aapko PKR chahiye to conversion consider kar sakte hain."
        )

    elif percentage_difference <= -1:
        recommendation = "CONSIDER_WAITING"
        message = (
            "Aaj ka USD/PKR rate 30-day average se neeche hai. "
            "Agar conversion urgent nahi hai to wait karna consider kar sakte hain."
        )

    else:
        recommendation = "NEUTRAL"
        message = (
            "Aaj ka USD/PKR rate 30-day average ke qareeb hai. "
            "Conversion ka decision aapki zaroorat par depend karta hai."
        )

    return {
        "agent": "FX Advisor",
        "pair": "USD/PKR",
        "current_rate": current_rate,
        "average_30_days": average_rate,
        "difference": round(difference, 2),
        "percentage_difference": round(percentage_difference, 2),
        "recommendation": recommendation,
        "reason": message,
        "data_source": "MOCK",
        "disclaimer": "Demo data only. This is not an exchange-rate prediction."
    }