"""
Extraction de mots-clés à partir d'une requête utilisateur.

Supprime les stopwords français courants pour ne garder que
les termes significatifs envoyés au module de scraping.

Exemples :
    >>> extract_keywords("je veux acheter un laptop pas cher")
    'laptop'
    >>> extract_keywords("meilleur téléphone samsung galaxy")
    'téléphone samsung galaxy'
"""


STOPWORDS_FR = {
    "je", "veux", "cherche", "trouver", "acheter",
    "meilleur", "pas", "cher", "bon", "marché",
    "un", "une", "des", "le", "la", "les", "du", "de",
    "pour", "avec", "sans", "sur", "dans",
    "et", "ou", "qui", "que", "quoi", "comment", "où",
}


def extract_keywords(text: str) -> str:
    """
    Nettoie une requête utilisateur en supprimant les stopwords français
    et les mots trop courts, puis retourne les mots-clés significatifs.

    Args:
        text: La requête brute de l'utilisateur.

    Returns:
        Les mots-clés significatifs joints par un espace.
    """
    if not text or not text.strip():
        return ""

    # 1. Minuscules
    words = text.lower().split()

    # 2. Supprime les stopwords
    # 3. Garde uniquement les mots de plus de 2 caractères
    keywords = [w for w in words if w not in STOPWORDS_FR and len(w) > 2]

    # 4. Retourne les mots restants joints par espace
    return " ".join(keywords)
