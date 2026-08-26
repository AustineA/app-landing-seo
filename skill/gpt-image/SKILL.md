---
name: gpt-image
description: Generate or edit raster images with OpenAI's gpt-image-2 model, including landscape feature images, transparent assets, sprites, and reference-conditioned edits. Use when another skill requests GPT Image or the user asks to create images with gpt-image.
---

# GPT Image

Generate images with OpenAI's `gpt-image-2` Images API through this skill's bundled helper.

## Setup

- Prefer `uv`; the script declares its `openai` dependency inline.
- Otherwise install `openai` with `python3 -m pip install -r requirements.txt` from this skill directory.
- Require `GPT_API_KEY` or `OPENAI_API_KEY` in the environment.
- Resolve `GPT_IMAGE_SKILL_DIR` to the directory containing this `SKILL.md`. Run the helper as `"$GPT_IMAGE_SKILL_DIR/scripts/generate_image.py"` so it works from any project directory.

## Generate

```bash
"$GPT_IMAGE_SKILL_DIR/scripts/generate_image.py" "<detailed prompt>" \
  --aspect-ratio 3:2 \
  --quality high \
  --background opaque \
  --format webp \
  --output "<destination>.webp"
```

Options:

- `--aspect-ratio`: `1:1`, `16:9`, `9:16`, `3:2`, `2:3`, `auto`, or an explicit supported size.
- `--quality`: `low`, `medium`, `high`, or `auto`.
- `--background`: `auto`, `transparent`, or `opaque`. Transparency requires PNG or WebP.
- `--format`: `png`, `jpeg`, or `webp`.
- `--reference PATH`: condition on an existing image; repeat for multiple references.
- `--sprite`: optimize the prompt for a centered game asset and default to a transparent background.
- `--model`: defaults to `gpt-image-2`; keep that default unless the user requests another compatible model.

## Prompt and output checks

Describe the subject, composition, viewpoint, lighting, materials, palette, and exclusions that matter. For feature images, explicitly prohibit text, letters, numbers, captions, watermarks, interface labels, and logos unless they are intentional.

Inspect every generated image at full size before using it. Check requested dimensions and format, subject relevance, crop safety, malformed objects, accidental glyphs, unintended branding, and any mismatch with reference images. Regenerate only when a concrete defect is visible, and change the prompt to address that defect rather than repeating the same request.

The helper creates missing output directories. It does not automatically open generated files.
