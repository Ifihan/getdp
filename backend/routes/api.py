"""
API routes for image processing and file uploads.
"""
import uuid
from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

from backend.config import TEMPLATES_DIR, FONTS_DIR, DEFAULT_FONT_PATH, DEFAULT_TEMPLATE_PATH, BASE_DIR
from backend.services import ImageProcessor
from backend.utils import (
    get_logger,
    validate_image_file,
    validate_font_file,
    validate_position_params,
)
from backend.utils.validators import ValidationError

api_bp = Blueprint("api", __name__, url_prefix="/api")
logger = get_logger()

# Default processor instance
_default_processor = None


def get_processor():
    """Get or create the default image processor."""
    global _default_processor
    if _default_processor is None:
        _default_processor = ImageProcessor()
    return _default_processor


@api_bp.route("/process-image", methods=["POST"])
def process_image():
    """
    Process an uploaded image and generate a display picture.

    Form data:
        - image: Image file (required)
        - username: User's name (required)
        - template_id: Custom template ID (optional)
        - font_id: Custom font ID (optional)
        - image_x: Image horizontal position 0-100 (optional)
        - image_y: Image vertical position 0-100 (optional)
        - image_size: Image size 10-100 (optional)
        - text_y: Text vertical position 0-100 (optional)
        - font_size: Font size 1-20 (optional)
        - text_color: Hex color code (optional)
    """
    try:
        # Validate image file
        if "image" not in request.files:
            logger.warning("Process request missing image file")
            return jsonify({"error": "No image provided"}), 400

        image_file = request.files["image"]
        validate_image_file(image_file)

        # Validate username
        username = request.form.get("username", "").strip()
        if not username:
            logger.warning("Process request missing username")
            return jsonify({"error": "Username is required"}), 400

        # Get position parameters
        position_params = {}
        for key in ["image_x", "image_y", "image_size", "image_shape", "text_x", "text_y", "font_size", "text_color"]:
            if key in request.form:
                position_params[key] = request.form[key]

        validated_params = validate_position_params(position_params)

        # Check for custom template/font
        template_id = request.form.get("template_id")
        font_id = request.form.get("font_id")

        processor = get_processor()

        # Use custom template if provided
        if template_id:
            template_path = TEMPLATES_DIR / template_id
            if template_path.exists():
                processor.set_template(template_path)
                logger.info(f"Using custom template: {template_id}")
            else:
                logger.warning(f"Custom template not found: {template_id}")
        else:
            processor.set_template(DEFAULT_TEMPLATE_PATH)

        # Use custom font if provided
        if font_id:
            font_path = FONTS_DIR / font_id
            if font_path.exists():
                processor.set_font(font_path)
                logger.info(f"Using custom font: {font_id}")
            else:
                logger.warning(f"Custom font not found: {font_id}")
        else:
            processor.set_font(DEFAULT_FONT_PATH)

        # Process the image
        image_data = image_file.read()
        result = processor.process(
            image_data=image_data,
            username=username,
            **validated_params
        )

        return jsonify({"image": result})

    except ValidationError as e:
        logger.warning(f"Validation error: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Image processing failed: {e}", exc_info=True)
        return jsonify({"error": "Failed to process image. Please try again."}), 500


@api_bp.route("/upload-template", methods=["POST"])
def upload_template():
    """
    Upload a custom template image.

    Form data:
        - template: Template image file (required)

    Returns:
        JSON with template_id for later use
    """
    try:
        if "template" not in request.files:
            return jsonify({"error": "No template file provided"}), 400

        template_file = request.files["template"]
        validate_image_file(template_file)

        # Generate unique filename
        original_name = secure_filename(template_file.filename)
        ext = Path(original_name).suffix
        template_id = f"{uuid.uuid4().hex}{ext}"

        # Save template
        save_path = TEMPLATES_DIR / template_id
        template_file.save(save_path)

        logger.info(f"Template uploaded: {template_id}")
        return jsonify({
            "template_id": template_id,
            "message": "Template uploaded successfully"
        })

    except ValidationError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Template upload failed: {e}", exc_info=True)
        return jsonify({"error": "Failed to upload template"}), 500


@api_bp.route("/upload-font", methods=["POST"])
def upload_font():
    """
    Upload a custom font file.

    Form data:
        - font: Font file (required, .ttf, .otf, .woff, .woff2)

    Returns:
        JSON with font_id for later use
    """
    try:
        if "font" not in request.files:
            return jsonify({"error": "No font file provided"}), 400

        font_file = request.files["font"]
        validate_font_file(font_file)

        # Generate unique filename
        original_name = secure_filename(font_file.filename)
        ext = Path(original_name).suffix
        font_id = f"{uuid.uuid4().hex}{ext}"

        # Save font
        save_path = FONTS_DIR / font_id
        font_file.save(save_path)

        logger.info(f"Font uploaded: {font_id}")
        return jsonify({
            "font_id": font_id,
            "message": "Font uploaded successfully"
        })

    except ValidationError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Font upload failed: {e}", exc_info=True)
        return jsonify({"error": "Failed to upload font"}), 500


# Keep backward compatibility with old endpoint
@api_bp.route("/legacy/process-image", methods=["POST"])
def legacy_process_image():
    """Legacy endpoint for backward compatibility."""
    return process_image()


@api_bp.route("/uploads/templates/<path:filename>")
def serve_template(filename):
    """Serve uploaded template files."""
    return send_from_directory(TEMPLATES_DIR, filename)


@api_bp.route("/uploads/fonts/<path:filename>")
def serve_font(filename):
    """Serve uploaded font files."""
    return send_from_directory(FONTS_DIR, filename)