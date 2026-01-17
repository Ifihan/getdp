"""
Admin routes for configuration management.
"""

import json
import uuid
from pathlib import Path
from flask import Blueprint, request, jsonify, render_template

from backend.config import BASE_DIR
from backend.utils import get_logger

admin_bp = Blueprint("admin", __name__)
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


def load_all_configs():
    """Load all configurations from file."""
    ensure_config_dir()

    if not CONFIG_FILE.exists():
        return {}

    try:
        with open(CONFIG_FILE, "r") as f:
            data = json.load(f)
        return data.get("configs", {})
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Error loading configs: {e}")
        return {}


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


def delete_config(config_id):
    """Delete a configuration from file."""
    ensure_config_dir()

    if not CONFIG_FILE.exists():
        return False

    try:
        with open(CONFIG_FILE, "r") as f:
            data = json.load(f)

        if "configs" in data and config_id in data["configs"]:
            del data["configs"][config_id]

            # Update default if we deleted it
            if data.get("default") and data["configs"]:
                # Set default to most recent config
                data["default"] = list(data["configs"].values())[-1]
            elif not data["configs"]:
                data["default"] = None

            with open(CONFIG_FILE, "w") as f:
                json.dump(data, f, indent=2)

            return True
        return False

    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Error deleting config: {e}")
        return False


@admin_bp.route("/")
def dashboard_page():
    """Serve the dashboard page (template creation)."""
    return render_template("dashboard.html")


@admin_bp.route("/templates")
def templates_page():
    """Serve the generated templates page."""
    return render_template("generated_templates.html")


@admin_bp.route("/admin")
def admin_page():
    """Serve the legacy admin panel page."""
    return render_template("admin.html")


# API routes for admin configuration
@admin_bp.route("/api/save-config", methods=["POST"])
def api_save_config():
    """
    Save admin configuration.

    JSON body:
        - template_name: Name of the template
        - template_id: Custom template ID (optional)
        - font_id: Custom font ID (optional)
        - image_x: Image horizontal position (optional)
        - image_y: Image vertical position (optional)
        - image_size: Image size (optional)
        - text_y: Text vertical position (optional)
        - font_size: Font size (optional)
        - text_color: Text color hex code (optional)
        - created_at: Creation timestamp (optional)
    """
    try:
        config = request.get_json()

        if not config:
            return jsonify({"error": "No configuration provided"}), 400

        config_id = save_config(config)

        logger.info(f"Configuration saved: {config_id}")
        return jsonify(
            {"message": "Configuration saved successfully", "config_id": config_id}
        )

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
            return jsonify({"config": config, "config_id": config_id})
        else:
            return jsonify({"config": None, "message": "No configuration found"})

    except Exception as e:
        logger.error(f"Failed to get configuration: {e}", exc_info=True)
        return jsonify({"error": "Failed to get configuration"}), 500


@admin_bp.route("/api/list-configs", methods=["GET"])
def api_list_configs():
    """
    List all saved configurations.

    Returns:
        - configs: Dictionary of all configurations keyed by config_id
    """
    try:
        configs = load_all_configs()
        return jsonify({"configs": configs})

    except Exception as e:
        logger.error(f"Failed to list configurations: {e}", exc_info=True)
        return jsonify({"error": "Failed to list configurations"}), 500


@admin_bp.route("/api/delete-config", methods=["DELETE"])
def api_delete_config():
    """
    Delete a configuration.

    Query params:
        - config_id: Configuration ID to delete (required)
    """
    try:
        config_id = request.args.get("config_id")

        if not config_id:
            return jsonify({"error": "config_id is required"}), 400

        success = delete_config(config_id)

        if success:
            logger.info(f"Configuration deleted: {config_id}")
            return jsonify({"message": "Configuration deleted successfully"})
        else:
            return jsonify({"error": "Configuration not found"}), 404

    except Exception as e:
        logger.error(f"Failed to delete configuration: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete configuration"}), 500
