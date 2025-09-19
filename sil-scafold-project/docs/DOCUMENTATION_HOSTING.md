# Documentation Hosting Guide

This guide explains how to host the project documentation on GitHub Pages.

## Overview

The project documentation is configured to be automatically built and deployed to GitHub Pages using GitHub Actions. This provides a clean, searchable, and navigable interface for all project documentation.

## Automated Setup

The `.github/workflows/docs.yml` workflow file is configured to:

1. Build the documentation using MkDocs with the Material theme
2. Deploy the built documentation to GitHub Pages
3. Update the documentation whenever changes are pushed to the main branch

## Manual Setup

If you prefer to set up and test the documentation locally before deploying:

### Prerequisites

- Python 3.7+
- pip

### Installation

```bash
# Install MkDocs and the Material theme
pip install mkdocs mkdocs-material pymdown-extensions
```

### Running Locally

```bash
# Navigate to the project root
cd sil-project

# Serve the documentation locally
mkdocs serve
```

The documentation will be available at http://localhost:8000.

### Building

```bash
# Build the documentation
mkdocs build
```

The built documentation will be in the `site` directory.

## Customization

### Configuration

The MkDocs configuration is in the `mkdocs.yml` file. You can modify this file to:

- Change the theme or theme colors
- Add or remove pages
- Configure plugins
- Set site metadata

### Adding Pages

To add a new page:

1. Create a Markdown file in the `docs` directory or a subdirectory
2. Add the page to the `nav` section in `mkdocs.yml`

Example:

```yaml
nav:
  - Home: 'index.md'
  - Backend:
    - Overview: 'backend/overview.md'
    - New Page: 'backend/new-page.md'  # Add your new page here
```

## GitHub Pages Setup

1. Go to your GitHub repository settings
2. Navigate to "Pages" in the sidebar
3. Set the source to "GitHub Actions"

## Troubleshooting

If the GitHub Pages deployment fails:

1. Check the GitHub Actions logs for errors
2. Verify that the repository has GitHub Pages enabled
3. Ensure the GitHub token has the correct permissions

## Resources

- [MkDocs Documentation](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)