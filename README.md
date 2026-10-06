# Ethan Mathew Baptism Invitation

A dependency-free, mobile-first invitation for the Holy Baptism of Ethan Mathew.

## Run locally

Open `index.html` directly in a browser, or serve the directory with any static web server:

```bash
python3 -m http.server
```

Update the ceremony date, venue copy, and Google Maps URLs in `index.html` and `script.js` before publishing.

Shared links use Open Graph and Twitter Card metadata from `index.html`. The preview image must remain publicly accessible for social platforms to fetch it.

## Remove image metadata

Before publishing, strip metadata from every JPEG and PNG in the repository (including untracked images) with:

```bash
python3 strip_image_metadata.py
```

The script keeps the original image formats and filenames while removing metadata segments and chunks.