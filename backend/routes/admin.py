"""
Admin routes for configuration management.
"""
import json
import uuid
from pathlib import Path
from flask import Blueprint, request, jsonify, render_template

from backend.config import BASE_DIR
from backend.utils import get_logger

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")
logger = get_logger()

# Configuration storage path
CONFIG_DIR = BASE_DIR / "data"
CONFIG_FILE = CONFIG_DIR / "admin_config.json"


def ensure_config_dir():
    """Ensure the configuration directory exists."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_config(config_id=None):
    """Load configuration from file."""
    ensure_config_dir()

    if not CONFIG_FILE.exists():
        return None

    try:
        with open(CONFIG_FILE, "r") as f:
            data = json.load(f)

        if config_id:
            # Look for specific config
            configs = data.get("configs", {})
            return configs.get(config_id)
        else:
            # Return default/latest config
            return data.get("default")

    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Error loading config: {e}")
        return None


def save_config(config, config_id=None):
    """Save configuration to file."""
    ensure_config_dir()

    try:
        # Load existing data
        data = {"configs": {}, "default": None}
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, "r") as f:
                data = json.load(f)

        # Generate config ID if not provided
        if not config_id:
            config_id = uuid.uuid4().hex[:8]

        # Save config
        if "configs" not in data:
            data["configs"] = {}

        data["configs"][config_id] = config
        data["default"] = config

        with open(CONFIG_FILE, "w") as f:
            json.dump(data, f, indent=2)

        return config_id

    except IOError as e:
        logger.error(f"Error saving config: {e}")
        raise


@admin_bp.route("/")
def admin_page():
    """Serve the admin panel page."""
    return render_template("admin.html")


# API routes for admin configuration
@admin_bp.route("/api/save-config", methods=["POST"])
def api_save_config():
    """
    Save admin configuration.

    JSON body:
        - template_id: Custom template ID (optional)
        - font_id: Custom font ID (optional)
        - image_x: Image horizontal position (optional)
        - image_y: Image vertical position (optional)
        - image_size: Image size (optional)
        - text_y: Text vertical position (optional)
        - font_size: Font size (optional)
        - text_color: Text color hex code (optional)
    """
    try:
        config = request.get_json()

        if not config:
            return jsonify({"error": "No configuration provided"}), 400

        config_id = save_config(config)

        logger.info(f"Configuration saved: {config_id}")
        return jsonify({
            "message": "Configuration saved successfully",
            "config_id": config_id
        })

    except Exception as e:
        logger.error(f"Failed to save configuration: {e}", exc_info=True)
        return jsonify({"error": "Failed to save configuration"}), 500


@admin_bp.route("/api/get-config", methods=["GET"])
def api_get_config():
    """
    Get admin configuration.

    Query params:
        - config_id: Specific configuration ID (optional)
    """
    try:
        config_id = request.args.get("config_id")
        config = load_config(config_id)

        if config:
            return jsonify({
                "config": config,
                "config_id": config_id
            })
        else:
            return jsonify({
                "config": None,
                "message": "No configuration found"
            })

    except Exception as e:
        logger.error(f"Failed to get configuration: {e}", exc_info=True)
        return jsonify({"error": "Failed to get configuration"}), 500