"""Main routes for serving the frontend."""

from flask import Blueprint, render_template

main_bp = Blueprint("main", __name__)


@main_bp.route("/generate-dp")
def generate_dp():
    """Serve the main application page."""
    return render_template("index.html")


@main_bp.route("/generate-image")
def index():
    """Legacy route for the main application page."""
    return render_template("index.html")
