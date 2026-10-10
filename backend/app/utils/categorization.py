import re

DEFAULT_CATEGORIES = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Health & Medical",
    "Housing",
    "Utilities",
    "Travel",
    "Education",
    "Other",
]

# Every user must keep this category. It's the import fallback.
FALLBACK_CATEGORY = "Other"

# Category names here must match DEFAULT_CATEGORIES.
# Order matters: the first category with a match wins, so "amazon prime"
# (Entertainment) is checked before "amazon" (Shopping).
KEYWORD_RULES: list[tuple[str, list[str]]] = [
    (
        "Food & Dining",
        [
            "swiggy",
            "zomato",
            "blinkit",
            "zepto",
            "bigbasket",
            "dmart",
            "reliance fresh",
            "more retail",
            "dominos",
            "domino's",
            "pizza hut",
            "kfc",
            "mcdonald",
            "burger king",
            "starbucks",
            "cafe coffee day",
            "chaayos",
            "haldiram",
            "biryani",
            "restaurant",
            "cafe",
            "bakery",
            "dhaba",
            "grocery",
            "kirana",
            "pizza",
            "burger",
            "coffee",
        ],
    ),
    (
        "Transportation",
        [
            "uber",
            "ola",
            "rapido",
            "redbus",
            "namma metro",
            "delhi metro",
            "hyderabad metro",
            "hmrl",
            "dmrc",
            "tsrtc",
            "bmtc",
            "fastag",
            "petrol",
            "indian oil",
            "iocl",
            "bpcl",
            "hpcl",
            "shell",
            "parking",
            "toll",
        ],
    ),
    (
        "Entertainment",
        [
            "netflix",
            "spotify",
            "hotstar",
            "jiocinema",
            "prime video",
            "amazon prime",
            "sony liv",
            "zee5",
            "youtube",
            "bookmyshow",
            "pvr",
            "inox",
            "steam",
            "playstation",
            "xbox",
            "gaana",
            "apple music",
        ],
    ),
    (
        "Health & Medical",
        [
            "apollo",
            "pharmeasy",
            "1mg",
            "netmeds",
            "medplus",
            "practo",
            "pharmacy",
            "hospital",
            "clinic",
            "dental",
            "dentist",
            "diagnostic",
            "cult.fit",
            "cultfit",
            "gym",
            "lab",
        ],
    ),
    (
        "Utilities",
        [
            "airtel",
            "jio",
            "vodafone",
            "bsnl",
            "act fibernet",
            "tata play",
            "tata sky",
            "electricity",
            "bescom",
            "tsspdcl",
            "tgspdcl",
            "indane",
            "hp gas",
            "broadband",
            "recharge",
            "dth",
            "water bill",
            "gas bill",
        ],
    ),
    (
        "Housing",
        ["rent", "landlord", "mortgage", "nobroker", "housing society", "maintenance"],
    ),
    (
        "Travel",
        [
            "irctc",
            "makemytrip",
            "goibibo",
            "cleartrip",
            "ixigo",
            "easemytrip",
            "yatra",
            "indigo",
            "air india",
            "akasa",
            "spicejet",
            "vistara",
            "airbnb",
            "oyo",
            "hotel",
            "booking.com",
        ],
    ),
    (
        "Education",
        [
            "udemy",
            "coursera",
            "unacademy",
            "byju",
            "tuition",
            "textbook",
            "bookstore",
            "leetcode",
            "college fee",
            "school fee",
            "exam fee",
            "chegg",
        ],
    ),
    (
        "Shopping",
        [
            "amazon",
            "amzn",
            "flipkart",
            "myntra",
            "ajio",
            "nykaa",
            "meesho",
            "reliance trends",
            "reliance digital",
            "croma",
            "decathlon",
            "ikea",
            "zara",
            "h&m",
            "uniqlo",
            "pantaloons",
            "westside",
            "lifestyle",
            "tata cliq",
        ],
    ),
]


def _piece(keyword: str) -> str:
    # Short keywords ("ola", "gym", "rent") must match whole words, otherwise
    # "cola" matches "ola". Longer ones can match inside UPI strings like
    # "SWIGGYINSTAMART".
    escaped = re.escape(keyword)
    return rf"(?<!\w){escaped}(?!\w)" if len(keyword) <= 4 else escaped


_COMPILED = [
    (category, re.compile("|".join(_piece(k) for k in keywords)))
    for category, keywords in KEYWORD_RULES
]


def categorize_by_keywords(text: str) -> str | None:
    lowered = text.lower()
    for category, pattern in _COMPILED:
        if pattern.search(lowered):
            return category
    return None
