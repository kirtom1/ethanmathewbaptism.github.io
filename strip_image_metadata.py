#!/usr/bin/env python3
"""Losslessly remove metadata chunks/segments from JPEG and PNG files."""

import os
import stat
import tempfile
from pathlib import Path


JPEG_METADATA_MARKERS = set(range(0xE0, 0xF0)) | {0xFE}
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
PNG_RENDERING_CHUNKS = {b"tRNS", b"acTL", b"fcTL", b"fdAT"}


def strip_jpeg(data):
    if not data.startswith(b"\xff\xd8"):
        raise ValueError("invalid JPEG signature")

    output = bytearray(data[:2])
    position = 2
    in_scan = False
    found_eoi = False

    while position < len(data):
        if in_scan:
            scan_start = position
            while True:
                marker_start = data.find(b"\xff", position)
                if marker_start == -1:
                    raise ValueError("JPEG scan has no end marker")
                marker_code = marker_start + 1
                while marker_code < len(data) and data[marker_code] == 0xFF:
                    marker_code += 1
                if marker_code == len(data):
                    raise ValueError("truncated JPEG marker")
                value = data[marker_code]
                if value == 0x00 or 0xD0 <= value <= 0xD7:
                    position = marker_code + 1
                    continue
                output.extend(data[scan_start:marker_start])
                position = marker_start
                in_scan = False
                break
            continue

        if data[position] != 0xFF:
            raise ValueError("expected JPEG marker")
        marker_start = position
        marker_code = position + 1
        while marker_code < len(data) and data[marker_code] == 0xFF:
            marker_code += 1
        if marker_code == len(data):
            raise ValueError("truncated JPEG marker")

        marker = data[marker_code]
        if marker == 0x00:
            raise ValueError("unexpected stuffed byte outside JPEG scan")
        if marker in {0x01, 0xD8} or 0xD0 <= marker <= 0xD9:
            end = marker_code + 1
        else:
            length_start = marker_code + 1
            if length_start + 2 > len(data):
                raise ValueError("truncated JPEG segment length")
            segment_length = int.from_bytes(data[length_start:length_start + 2], "big")
            if segment_length < 2:
                raise ValueError("invalid JPEG segment length")
            end = length_start + segment_length
            if end > len(data):
                raise ValueError("truncated JPEG segment")

        if marker not in JPEG_METADATA_MARKERS:
            output.extend(data[marker_start:end])
        position = end

        if marker == 0xDA:
            in_scan = True
        elif marker == 0xD9:
            found_eoi = True
            break

    if not found_eoi:
        raise ValueError("JPEG has no end marker")
    return bytes(output)


def strip_png(data):
    if not data.startswith(PNG_SIGNATURE):
        raise ValueError("invalid PNG signature")

    output = bytearray(PNG_SIGNATURE)
    position = len(PNG_SIGNATURE)
    found_iend = False

    while position < len(data):
        if position + 12 > len(data):
            raise ValueError("truncated PNG chunk")
        length = int.from_bytes(data[position:position + 4], "big")
        chunk_type = data[position + 4:position + 8]
        end = position + 12 + length
        if end > len(data):
            raise ValueError("truncated PNG chunk data")

        is_ancillary = chunk_type[0] & 0x20
        if not is_ancillary or chunk_type in PNG_RENDERING_CHUNKS:
            output.extend(data[position:end])
        position = end

        if chunk_type == b"IEND":
            found_iend = True
            break

    if not found_iend or position != len(data):
        raise ValueError("invalid PNG end marker or trailing data")
    return bytes(output)


def image_paths(root):
    for directory, subdirectories, filenames in os.walk(root):
        subdirectories[:] = [name for name in subdirectories if name != ".git"]
        for filename in filenames:
            path = Path(directory, filename)
            if not path.is_symlink() and path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                yield path


def replace_file(path, data):
    mode = stat.S_IMODE(path.stat().st_mode)
    descriptor, temporary_path = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.")
    try:
        with os.fdopen(descriptor, "wb") as temporary_file:
            temporary_file.write(data)
        os.chmod(temporary_path, mode)
        os.replace(temporary_path, path)
    finally:
        if os.path.exists(temporary_path):
            os.unlink(temporary_path)


def main():
    root = Path(__file__).resolve().parent
    paths = sorted(image_paths(root))
    for path in paths:
        original = path.read_bytes()
        if path.suffix.lower() == ".png":
            cleaned = strip_png(original)
        else:
            cleaned = strip_jpeg(original)
        replace_file(path, cleaned)

    print(f"Processed {len(paths)} image(s):")
    for path in paths:
        print(f"  {path.relative_to(root)}")


if __name__ == "__main__":
    main()
