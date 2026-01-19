"""Input validation utilities."""

from pathlib import Path
from werkzeug.datastructures import FileStorage
from backend.config import ALLOWED_IMAGE_EXTENSIONS, ALLOWED_FONT_EXTENSIONS, MAX_CONTENT_LENGTH
from backend.utils.logger import get_logger

logger = get_logger()


class ValidationError(Exception):
    """Custom validation error."""
    pass


def validate_image_file(file: FileStorage, max_size: int = MAX_CONTENT_LENGTH) -> None:
    """Validate an uploaded image file."""
    if not file or file.filename == "":
        logger.warning("Image validation failed: No file provided")
        raise ValidationError("No image file provided")

    filename = file.filename.lower()
    ext = Path(filename).suffix

    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        logger.warning(f"Image validation failed: Invalid extension '{ext}'")
        raise ValidationError(f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}")

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)

    if size > max_size:
        logger.warning(f"Image validation failed: File too large ({size} bytes)")
        raise ValidationError(f"File too large. Maximum size: {max_size // (1024*1024)}MB")

    logger.info(f"Image validated: {filename} ({size} bytes)")


def validate_font_file(file: FileStorage, max_size: int = 10 * 1024 * 1024) -> None:
    """Validate an uploaded font file."""
    if not file or file.filename == "":
        logger.warning("Font validation failed: No file provided")
        raise ValidationError("No font file provided")

    filename = file.filename.lower()
    ext = Path(filename).suffix

    if ext not in ALLOWED_FONT_EXTENSIONS:
        logger.warning(f"Font validation failed: Invalid extension '{ext}'")
        raise ValidationError(f"Invalid font type. Allowed: {', '.join(ALLOWED_FONT_EXTENSIONS)}")

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)

    if size > max_size:
        logger.warning(f"Font validation failed: File too large ({size} bytes)")
        raise ValidationError(f"Font file too large. Maximum size: {max_size // (1024*1024)}MB")

    logger.info(f"Font validated: {filename} ({size} bytes)")


def validate_position_params(params: dict) -> dict:
    """Validate and sanitize position parameters."""
    sanitized = {}

    for key in ["image_x", "image_y"]:
        if key in params:
            try:
                value = float(params[key])
                if not 0 <= value <= 100:
                    raise ValidationError(f"{key} must be between 0 and 100")
                sanitized[key] = value / 100
            except (ValueError, TypeError):
                logger.warning(f"Invalid {key} value: {params.get(key)}")
                raise ValidationError(f"Invalid {key} value")

    if "image_size" in params:
        try:
            value = float(params["image_size"])
            if not 10 <= value <= 100:
                raise ValidationError("image_size must be between 10 and 100")
            sanitized["image_size"] = value / 100
        except (ValueError, TypeError):
            logger.warning(f"Invalid image_size value: {params.get('image_size')}")
            raise ValidationError("Invalid image_size value")

    if "image_shape" in params:
        shape = params["image_shape"].lower() if isinstance(params["image_shape"], str) else ""
        if shape in ["circle", "rectangle"]:
            sanitized["image_shape"] = shape
        else:
            logger.warning(f"Invalid image_shape value: {params.get('image_shape')}")
            raise ValidationError("image_shape must be 'circle' or 'rectangle'")

    if "text_x" in params:
        try:
            value = float(params["text_x"])
            if not 0 <= value <= 100:
                raise ValidationError("text_x must be between 0 and 100")
            sanitized["text_x"] = value / 100
        except (ValueError, TypeError):
            logger.warning(f"Invalid text_x value: {params.get('text_x')}")
            raise ValidationError("Invalid text_x value")

    if "text_y" in params:
        try:
            value = float(params["text_y"])
            if not 0 <= value <= 100:
                raise ValidationError("text_y must be between 0 and 100")
            sanitized["text_y"] = value / 100
        except (ValueError, TypeError):
            logger.warning(f"Invalid text_y value: {params.get('text_y')}")
            raise ValidationError("Invalid text_y value")

    if "font_size" in params:
        try:
            value = float(params["font_size"])
            if not 1 <= value <= 20:
                raise ValidationError("font_size must be between 1 and 20")
            sanitized["font_size"] = value / 100
        except (ValueError, TypeError):
            logger.warning(f"Invalid font_size value: {params.get('font_size')}")
            raise ValidationError("Invalid font_size value")

    if "text_color" in params:
        color = params["text_color"]
        if isinstance(color, str):
            color = color.strip().lstrip("#")
            if len(color) == 6:
                try:
                    r = int(color[0:2], 16)
                    g = int(color[2:4], 16)
                    b = int(color[4:6], 16)
                    sanitized["text_color"] = (r, g, b, 255)
                except ValueError:
                    logger.warning(f"Invalid text_color hex: {color}")
                    raise ValidationError("Invalid text_color format")

    logger.info(f"Position params validated: {sanitized}")
    return sanitized
