"""
Image processing service for DP generation.
"""
import io
import base64
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
from pillow_heif import register_heif_opener

from backend.config import (
    DEFAULT_TEMPLATE_PATH,
    DEFAULT_FONT_PATH,
    DEFAULT_CIRCLE_SIZE_PERCENT,
    DEFAULT_CIRCLE_Y_PERCENT,
    DEFAULT_TEXT_Y_PERCENT,
    DEFAULT_FONT_SIZE_PERCENT,
    DEFAULT_TEXT_COLOR,
)
from backend.utils.logger import get_logger

# Register HEIF/HEIC support
register_heif_opener()

logger = get_logger()


class ImageProcessor:
    """Service for processing and generating display pictures."""

    def __init__(
        self,
        template_path: Path = None,
        font_path: Path = None,
    ):
        """
        Initialize the image processor.

        Args:
            template_path: Path to template/frame image
            font_path: Path to font file
        """
        self.template_path = template_path or DEFAULT_TEMPLATE_PATH
        self.font_path = font_path or DEFAULT_FONT_PATH
        self._template = None
        self._font = None
        self._load_resources()

    def _load_resources(self) -> None:
        """Load template and font resources."""
        try:
            self._template = Image.open(self.template_path).convert("RGBA")
            self.frame_width, self.frame_height = self._template.size
            self._base_font_size = int(self.frame_width * DEFAULT_FONT_SIZE_PERCENT)
            self._font = ImageFont.truetype(str(self.font_path), self._base_font_size)
            logger.info(
                f"Resources loaded: template={self.template_path}, "
                f"font={self.font_path}, size={self.frame_width}x{self.frame_height}"
            )
        except FileNotFoundError as e:
            logger.error(f"Resource file not found: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to load resources: {e}")
            raise

    def set_template(self, template_path: Path) -> None:
        """Update the template image."""
        self.template_path = template_path
        self._template = Image.open(template_path).convert("RGBA")
        self.frame_width, self.frame_height = self._template.size
        self._base_font_size = int(self.frame_width * DEFAULT_FONT_SIZE_PERCENT)
        logger.info(f"Template updated: {template_path}")

    def set_font(self, font_path: Path) -> None:
        """Update the font."""
        self.font_path = font_path
        self._font = ImageFont.truetype(str(font_path), self._base_font_size)
        logger.info(f"Font updated: {font_path}")

    def process(
        self,
        image_data: bytes,
        username: str,
        image_x: float = None,
        image_y: float = None,
        image_size: float = None,
        image_shape: str = None,
        text_x: float = None,
        text_y: float = None,
        font_size: float = None,
        text_color: tuple = None,
    ) -> str:
        """
        Process an image and generate a display picture.

        Args:
            image_data: Raw image bytes
            username: User's name to display
            image_x: Horizontal position (0-1, center offset)
            image_y: Vertical position (0-1, from top)
            image_size: Photo size as fraction of frame width
            image_shape: Photo shape ('circle' or 'rectangle')
            text_x: Text horizontal position (0-1, from left)
            text_y: Text vertical position (0-1, from top)
            font_size: Font size as fraction of frame width
            text_color: RGBA tuple for text color

        Returns:
            Base64-encoded JPEG image string
        """
        if not self._template or not self._font:
            raise RuntimeError("Resources not loaded")

        logger.info(f"Processing image for user: {username}")

        # Use defaults if not provided
        photo_size = image_size or DEFAULT_CIRCLE_SIZE_PERCENT
        photo_y = image_y if image_y is not None else DEFAULT_CIRCLE_Y_PERCENT
        photo_x_offset = image_x if image_x is not None else 0.5
        photo_shape = image_shape or 'circle'
        text_x_pos = text_x if text_x is not None else 0.5
        text_y_pos = text_y or DEFAULT_TEXT_Y_PERCENT
        font_size_pct = font_size or DEFAULT_FONT_SIZE_PERCENT
        color = text_color or DEFAULT_TEXT_COLOR

        try:
            # Open and process user image
            user_image = Image.open(io.BytesIO(image_data))

            # Handle EXIF orientation
            try:
                user_image = ImageOps.exif_transpose(user_image)
            except Exception:
                pass

            user_image = user_image.convert("RGBA")

            # Calculate photo dimensions
            photo_diameter = int(self.frame_width * photo_size)

            # Resize and crop
            user_image_resized = self._resize_and_crop(
                user_image, photo_diameter, photo_diameter
            )

            # Apply mask based on shape
            if photo_shape == 'circle':
                mask = self._create_circular_mask(photo_diameter)
                user_image_resized.putalpha(mask)
            else:
                # Rectangle: no special mask needed, just keep as is
                pass

            # Create result from template
            result = self._template.copy()

            # Calculate paste position
            paste_x = int((self.frame_width * photo_x_offset) - (photo_diameter / 2))
            paste_y = int(self.frame_height * photo_y) - (photo_diameter // 2)

            # Paste user image
            result.paste(user_image_resized, (paste_x, paste_y), user_image_resized)

            # Add username text
            draw = ImageDraw.Draw(result)
            self._add_username_text(
                draw, username, text_x_pos, text_y_pos, font_size_pct, color
            )

            # Convert to RGB and encode
            result_rgb = result.convert("RGB")
            img_io = io.BytesIO()
            result_rgb.save(img_io, "JPEG", quality=90, optimize=False)
            img_io.seek(0)

            img_base64 = base64.b64encode(img_io.getvalue()).decode("utf-8")
            logger.info(f"Image processed successfully for: {username}")

            return f"data:image/jpeg;base64,{img_base64}"

        except Exception as e:
            logger.error(f"Image processing failed: {e}", exc_info=True)
            raise

    def _resize_and_crop(
        self, image: Image.Image, target_width: int, target_height: int
    ) -> Image.Image:
        """Resize and crop image to fit target dimensions."""
        # Limit max dimension for memory efficiency
        max_dimension = 1024
        if image.width > max_dimension or image.height > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.BICUBIC)

        img_ratio = image.width / image.height
        target_ratio = target_width / target_height

        if img_ratio > target_ratio:
            new_width = int(img_ratio * target_height)
            new_height = target_height
        else:
            new_width = target_width
            new_height = int(target_width / img_ratio)

        image = image.resize((new_width, new_height), Image.Resampling.BICUBIC)

        left = int((new_width - target_width) / 2)
        top = int((new_height - target_height) / 2)
        right = int((new_width + target_width) / 2)
        bottom = int((new_height + target_height) / 2)

        return image.crop((left, top, right, bottom))

    def _create_circular_mask(self, size: int) -> Image.Image:
        """Create a circular mask for the profile picture."""
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        return mask

    def _add_username_text(
        self,
        draw: ImageDraw.ImageDraw,
        username: str,
        text_x: float,
        text_y: float,
        font_size_pct: float,
        color: tuple,
    ) -> None:
        """Add username text to the image."""
        username = username.upper()
        text_box_width = int(self.frame_width * 0.4)

        # Calculate font size
        base_size = int(self.frame_width * font_size_pct)

        # Adjust for long names
        if len(username) > 15:
            base_size = int(base_size * (15 / len(username)))

        font = self._font.font_variant(size=base_size)

        # Calculate line wrapping
        avg_char_width = sum(
            font.getbbox(c)[2] for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        ) / 26
        max_chars_per_line = int(text_box_width / avg_char_width)
        lines = textwrap.wrap(username, width=max_chars_per_line, break_long_words=True)

        if not lines:
            return

        # Calculate text position
        line_heights = [
            font.getbbox(line)[3] - font.getbbox(line)[1] for line in lines
        ]
        total_text_height = sum(line_heights) + (len(lines) - 1) * int(base_size * 0.3)
        text_box_center_y = int(self.frame_height * text_y)
        start_y = text_box_center_y - (total_text_height // 2)

        # Draw text (centered on text_x position)
        current_y = start_y
        for line, line_height in zip(lines, line_heights):
            text_width = font.getbbox(line)[2]
            line_x = int(self.frame_width * text_x) - (text_width // 2)
            draw.text((line_x, current_y), line, fill=color, font=font)
            current_y += line_height + int(base_size * 0.3)