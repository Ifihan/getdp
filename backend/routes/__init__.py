"""Routes package initialization."""

from .api import api_bp
from .main import main_bp
from .admin import admin_bp

__all__ = ["api_bp", "main_bp", "admin_bp"]
