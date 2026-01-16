"""
Application configuration management.
"""

import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
TEMPLATES_DIR = UPLOAD_DIR / "templates"
FONTS_DIR = UPLOAD_DIR / "fonts"
DEFAULT_FONTS_DIR = BASE_DIR / "fonts"

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
TEMPLATES_DIR.mkdir(exist_ok=True)
FONTS_DIR.mkdir(exist_ok=True)

# File size limits
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# Default assets
DEFAULT_FONT_PATH = DEFAULT_FONTS_DIR / "ClashDisplay-Medium.otf"
DEFAULT_TEMPLATE_PATH = BASE_DIR / "demo.png"

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".heic", ".heif", ".webp"}
ALLOWED_FONT_EXTENSIONS = {".ttf", ".otf", ".woff", ".woff2"}

# Image processing defaults
DEFAULT_CIRCLE_SIZE_PERCENT = 0.395  # 39.5% of frame width
DEFAULT_CIRCLE_Y_PERCENT = 0.50  # 50% from top (centered)
DEFAULT_TEXT_Y_PERCENT = 0.745  # 74.5% from top
DEFAULT_FONT_SIZE_PERCENT = 0.04  # 4% of frame width
DEFAULT_TEXT_COLOR = (0, 0, 0, 255)  # Black


class Config:
    """Flask configuration class."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    MAX_CONTENT_LENGTH = MAX_CONTENT_LENGTH
    DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
