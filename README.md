# DP Generator

A web application for creating customizable profile picture (DP) templates for events, conferences, or communities. Create templates with custom frames, fonts, and positioning, then share links for users to generate their personalized profile pictures.

## Features

- **Template Creation Dashboard** - Create and manage multiple DP templates
- **Drag-and-Drop Positioning** - Visually position photo and text elements
- **Custom Fonts** - Upload and use custom fonts (.ttf, .otf, .woff)
- **Flexible Photo Shapes** - Circle or rectangle photo frames
- **Social Media Sharing** - Built-in sharing for Twitter, LinkedIn, and Instagram
- **Image Support** - Supports PNG, JPG, and HEIC/HEIF formats
- **Responsive Design** - Works on desktop and mobile devices
- **REST API** - Programmatic access for template management

## Quick Start

### Prerequisites

- Python 3.11 or higher
- [uv](https://docs.astral.sh/uv/) (recommended) or pip

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ifihan/getdp.git
   cd getdp
   ```

2. **Install dependencies**

   Using `uv` (recommended):

   ```bash
   uv sync
   ```

   Or using pip:

   ```bash
   pip install -e .
   ```

3. **Run the application**

   ```bash
   uv run python main.py
   ```

   Or:

   ```bash
   python main.py
   ```

4. **Open in browser**

   Navigate to `http://localhost:8080`

## Usage

### Creating a Template

1. Go to the **Create Template** page (`/`)
2. Upload your template image (PNG with transparency recommended)
3. Configure settings:
   - **Template Name** - Unique identifier for your template
   - **Event Name** - Displayed as the page title
   - **Photo Shape** - Circle or rectangle
   - **Photo Size** - 15-70% of the template
   - **Font Size** - 2-10% of image height
   - **Text Color** - Color picker for name text
   - **Custom Font** - Optional font upload
4. Drag the photo and text handles to position elements
5. Save and get your shareable link

### Managing Templates

Visit the **Generated Templates** page (`/templates`) to:

- View all saved templates
- Search templates by name
- Edit existing templates
- Delete templates
- Copy shareable links

### User Experience

When users visit a template link:

1. Enter their name (optional based on template settings)
2. Upload their photo
3. Click "Generate DP"
4. Download or share to social media

## API Reference

| Method | Endpoint                            | Description                |
| ------ | ----------------------------------- | -------------------------- |
| GET    | `/api/get-config?config_id={id}`    | Get template configuration |
| GET    | `/api/list-configs`                 | List all templates         |
| POST   | `/api/save-config`                  | Create/update template     |
| DELETE | `/api/delete-config?config_id={id}` | Delete template            |
| POST   | `/api/process-image`                | Generate DP image          |

## Deployment

### Using Docker

```bash
docker build -t dp-generator .
docker run -p 8080:8080 dp-generator
```

### Using Gunicorn (Production)

```bash
gunicorn -w 4 -b 0.0.0.0:8080 main:app
```

### Environment Variables

| Variable      | Description            | Default     |
| ------------- | ---------------------- | ----------- |
| `PORT`        | Server port            | `8080`      |
| `DATA_DIR`    | Data storage directory | `./data`    |
| `UPLOADS_DIR` | Uploads directory      | `./uploads` |

## Project Structure

```
.
├── main.py                 # Flask application entry point
├── backend/
│   ├── config.py          # Configuration settings
│   ├── routes/
│   │   ├── main.py        # Main page routes
│   │   ├── api.py         # API endpoints
│   │   └── admin.py       # Admin routes
│   ├── services/
│   │   └── image_processor.py  # Image processing logic
│   └── utils/
│       ├── logger.py      # Logging configuration
│       └── validators.py  # Input validation
├── templates/             # HTML templates
│   ├── index.html        # User DP generation page
│   ├── dashboard.html    # Template creation page
│   ├── generated_templates.html  # Template management
│   └── docs.html         # Documentation page
├── static/
│   ├── css/style.css     # Styles
│   └── js/               # JavaScript files
├── data/                  # Stored configurations
├── uploads/               # Uploaded templates and fonts
├── fonts/                 # Default fonts
├── pyproject.toml        # Project configuration
├── Dockerfile            # Docker configuration
└── README.md             # This file
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
