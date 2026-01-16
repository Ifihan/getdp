"""
DP Generator Application - Main Entry Point

A Flask application for generating customized display pictures
with support for custom templates, fonts, and positioning.
"""
import os
import sys

# Add the project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from backend.config import Config
from backend.routes import api_bp, main_bp, admin_bp
from backend.utils import setup_logger

# Initialize logger
logger = setup_logger()


def create_app(config_class=Config):
    """
    Application factory for creating the Flask app.

    Args:
        config_class: Configuration class to use

    Returns:
        Configured Flask application
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Register blueprints
    app.register_blueprint(admin_bp)  # Admin at root
    app.register_blueprint(api_bp)
    app.register_blueprint(main_bp)

    # Register error handlers
    register_error_handlers(app)

    # Add backward compatibility route
    register_legacy_routes(app)

    logger.info("Application initialized successfully")
    return app


def register_error_handlers(app):
    """Register global error handlers."""

    @app.errorhandler(400)
    def bad_request(error):
        logger.warning(f"Bad request: {error}")
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(404)
    def not_found(error):
        logger.warning(f"Not found: {request.path}")
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        logger.warning("File too large")
        return jsonify({"error": "File too large. Maximum size is 16MB"}), 413

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


def register_legacy_routes(app):
    """Register backward-compatible routes from old API."""
    from backend.services import ImageProcessor
    from backend.utils.validators import ValidationError, validate_image_file

    processor = ImageProcessor()

    @app.route("/process-image", methods=["POST"])
    def legacy_process():
        """Legacy endpoint for backward compatibility."""
        try:
            if "image" not in request.files:
                return jsonify({"error": "No image provided"}), 400

            uploaded_file = request.files["image"]
            validate_image_file(uploaded_file)

            username = request.form.get("username", "").strip()
            if not username:
                return jsonify({"error": "Username is required"}), 400

            image_data = uploaded_file.read()
            result = processor.process(image_data=image_data, username=username)

            return jsonify({"image": result})

        except ValidationError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.error(f"Legacy processing failed: {e}", exc_info=True)
            return jsonify({"error": str(e)}), 500


# Create the application instance
app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    logger.info(f"Starting server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)