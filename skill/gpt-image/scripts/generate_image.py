#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#   "openai",
# ]
# ///

"""Generate or edit images with OpenAI's Images API."""

import argparse
import base64
import datetime
import os
from pathlib import Path
import sys

from openai import OpenAI


ASPECT_TO_SIZE = {
    "1:1": "1024x1024",
    "square": "1024x1024",
    "16:9": "1536x1024",
    "3:2": "1536x1024",
    "landscape": "1536x1024",
    "9:16": "1024x1536",
    "2:3": "1024x1536",
    "portrait": "1024x1536",
    "auto": "auto",
}


def resolve_size(aspect_or_size: str) -> str:
    return ASPECT_TO_SIZE.get(aspect_or_size, aspect_or_size)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate images using OpenAI gpt-image-2"
    )
    parser.add_argument("prompt", help="The text prompt for image generation")
    parser.add_argument(
        "--output",
        "-o",
        help="Output filename (default: generated_image_<timestamp>.<format>)",
    )
    parser.add_argument(
        "--model", "-m", default="gpt-image-2", help="Model ID (default: gpt-image-2)"
    )
    parser.add_argument(
        "--aspect-ratio",
        "-ar",
        default="1:1",
        help=(
            "Aspect ratio or explicit size: 1:1, 16:9, 9:16, 3:2, 2:3, "
            "auto, or e.g. 1024x1024"
        ),
    )
    parser.add_argument(
        "--quality",
        "-q",
        default="high",
        choices=["low", "medium", "high", "auto"],
        help="Render quality (default: high)",
    )
    parser.add_argument(
        "--background",
        "-b",
        default="auto",
        choices=["auto", "transparent", "opaque"],
        help="Background handling (default: auto)",
    )
    parser.add_argument(
        "--format",
        "-f",
        default="png",
        choices=["png", "jpeg", "webp"],
        help="Output image format (default: png)",
    )
    parser.add_argument(
        "--sprite",
        action="store_true",
        help="Optimize the prompt for a centered game asset with transparency",
    )
    parser.add_argument(
        "--reference",
        "-r",
        action="append",
        default=[],
        help="Reference image for edit/conditioning; repeat for multiple images",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    api_key = os.environ.get("GPT_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: set GPT_API_KEY or OPENAI_API_KEY before generating images.")
        sys.exit(1)

    extension = "jpg" if args.format == "jpeg" else args.format
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = Path(args.output or f"generated_image_{timestamp}.{extension}")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    prompt = args.prompt
    background = args.background
    if args.sprite:
        prompt = f"{prompt}, single sprite, game asset, centered, clean edges"
        if background == "auto":
            background = "transparent"

    references = [Path(value) for value in args.reference]
    missing = [str(path) for path in references if not path.is_file()]
    if missing:
        print(f"Error: reference image not found: {missing[0]}")
        sys.exit(1)

    size = resolve_size(args.aspect_ratio)
    client = OpenAI(api_key=api_key)
    print(
        f"Generating with {args.model}: size={size} quality={args.quality} "
        f"background={background} format={args.format}"
    )

    try:
        if references:
            image_files = [path.open("rb") for path in references]
            try:
                result = client.images.edit(
                    model=args.model,
                    image=image_files if len(image_files) > 1 else image_files[0],
                    prompt=prompt,
                    size=size,
                    quality=args.quality,
                    background=background,
                    output_format=args.format,
                )
            finally:
                for image_file in image_files:
                    image_file.close()
        else:
            result = client.images.generate(
                model=args.model,
                prompt=prompt,
                size=size,
                quality=args.quality,
                background=background,
                output_format=args.format,
            )

        image_b64 = result.data[0].b64_json
        if not image_b64:
            raise RuntimeError("the model returned no image data")

        output_path.write_bytes(base64.b64decode(image_b64))
        print(f"Image saved to: {output_path.resolve()}")
    except Exception as error:
        print(f"Error: image generation failed: {error}")
        sys.exit(1)


if __name__ == "__main__":
    main()
