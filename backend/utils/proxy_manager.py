"""
Proxy manager — gestion future des proxies pour éviter les blocages IP.
"""

import random
from typing import Optional, List


class ProxyManager:
    """
    Gestionnaire de proxies pour les requêtes de scraping.
    Utile quand les plateformes bloquent l'IP du serveur.
    
    Usage futur:
        manager = ProxyManager()
        manager.add_proxies(["http://proxy1:8080", "http://proxy2:8080"])
        proxy = manager.get_proxy()
    """

    def __init__(self):
        self._proxies: List[str] = []
        self._blacklisted: set = set()

    def add_proxies(self, proxies: List[str]):
        """Ajoute des proxies à la liste."""
        self._proxies.extend(proxies)

    def get_proxy(self) -> Optional[str]:
        """Retourne un proxy aléatoire non blacklisté."""
        available = [p for p in self._proxies if p not in self._blacklisted]
        if not available:
            return None
        return random.choice(available)

    def blacklist(self, proxy: str):
        """Blackliste un proxy défaillant."""
        self._blacklisted.add(proxy)

    def reset(self):
        """Réinitialise la blacklist."""
        self._blacklisted.clear()

    @property
    def count(self) -> int:
        """Nombre de proxies disponibles."""
        return len(self._proxies) - len(self._blacklisted)
