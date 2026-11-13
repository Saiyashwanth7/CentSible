"""Prepare receipt files for the vision model. CPU-bound, so call via asyncio.to_thread."""

import base64
import io

import fitz  # PyMuPDF, already in requirements
from PIL import Image, ImageOps

from app.exceptions.csv_import import InvalidImportedFile

MAX_EDGE = 1600  # big enough to read small print, small enough to keep the request light
MAX_PDF_PAGES = 3


def sniff_kind(data: bytes, filename: str) -> str | None:
    """Decide csv / pdf / image from the bytes, not from the browser's content-type."""
    if data.startswith(b"%PDF"):
        return "pdf"
    if (
        data[:3] == b"\xff\xd8\xff"
        or data[:8] == b"\x89PNG\r\n\x1a\n"
        or (data[:4] == b"RIFF" and data[8:12] == b"WEBP")
    ):
        return "image"
    if filename.lower().endswith((".csv", ".tsv", ".txt")) and b"\x00" not in data[:4096]:
        return "csv"
    return None


def _to_data_url(img: Image.Image) -> str:
    img = ImageOps.exif_transpose(img).convert("RGB")  # phone photos are often rotated via EXIF
    img.thumbnail((MAX_EDGE, MAX_EDGE))
    buffer = io.BytesIO()
    img.save(buffer, "JPEG", quality=85)
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode()


def receipt_data_urls(data: bytes, kind: str) -> list[str]:
    try:
        if kind == "pdf":
            doc = fitz.open(stream=data, filetype="pdf")
            urls = []
            for i in range(min(doc.page_count, MAX_PDF_PAGES)):
                pix = doc[i].get_pixmap(dpi=150)
                urls.append(_to_data_url(Image.frombytes("RGB", (pix.width, pix.height), pix.samples)))
            if not urls:
                raise InvalidImportedFile("This PDF has no pages.")
            return urls
        with Image.open(io.BytesIO(data)) as img:
            return [_to_data_url(img)]
    except InvalidImportedFile:
        raise
    except Exception:  # corrupt files, decompression bombs, encrypted PDFs ...
        raise InvalidImportedFile("Couldn't open this receipt. Try a clearer photo.") from None
