# App Landing SEO

An installable Claude Code and Codex skill for researching, writing, building, and validating an SEO landing site for a mobile app. It produces long-tail guide articles and generates a unique landscape feature image for every guide with OpenAI's `gpt-image-2`.

## What it does

1. Pulls App Store and Google Play metadata and visual assets.
2. Researches primary, secondary, and long-tail search keywords.
3. Builds a statically rendered landing page with structured data, guides, FAQs, sitemap, and robots.txt.
4. Bundles a GPT Image helper that generates a 1536×1024 WebP feature image for every guide.
5. Audits copy for common AI-writing patterns and verifies the final build.

## Installation

### Claude Code

After pushing this repository to GitHub:

```bash
claude install-skill github.com/<owner>/app-landing-seo
```

### Codex

Ask Codex to install the skill from the repository URL, or use its skill installer with:

```text
https://github.com/<owner>/app-landing-seo
```

## Requirements

- `uv` (recommended), or Python 3 with `pip install -r requirements.txt`
- `GPT_API_KEY` or `OPENAI_API_KEY` for feature-image generation
- Internet access for store metadata, search research, and the OpenAI Images API

The image generator is included at `scripts/generate_image.py`; users do not need to install a separate GPT Image skill.

## Usage

Run the skill from the mobile app or landing-page repository you want to optimize:

```text
/app-landing-seo
```

Then provide the App Store URL or app ID and the landing-page repository when prompted.

## Repository layout

| File | Purpose |
| --- | --- |
| `SKILL.md` | End-to-end SEO and landing-page workflow |
| `scripts/generate_image.py` | Bundled `gpt-image-2` image generator |
| `requirements.txt` | Python fallback dependency |

## License

MIT
