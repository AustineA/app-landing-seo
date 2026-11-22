# App Landing SEO

Two AI coding-agent skills packaged with an `npx` installer:

- **`app-landing-seo`** researches, writes, builds, and validates an SEO landing site for a mobile app.
- **`gpt-image`** generates and edits images with OpenAI's `gpt-image-2` model.

The SEO skill calls the separate GPT Image skill to create one landscape feature image for every guide article. `gpt-image` can also be invoked independently.

## Installation

```bash
npx github:AustineA/app-landing-seo
```

This installs both skills into:

```text
~/.agents/skills/app-landing-seo/
~/.agents/skills/gpt-image/
```

It then symlinks both skills to every detected supported agent, including Claude Code, Codex, Cursor, Windsurf, Antigravity, Trae, and Amp.

Other commands:

```bash
npx github:AustineA/app-landing-seo update
npx github:AustineA/app-landing-seo status
npx github:AustineA/app-landing-seo uninstall
```

### Updating

```bash
npx github:AustineA/app-landing-seo update
```

It compares the latest commit on GitHub with the one recorded at install time. If yours is older, it clones the latest version and installs it. The installed copy is replaced, not merged, so files removed from a skill don't linger. Restart your agent afterwards.

## Requirements

- Node.js 18+ for the installer
- `uv` (recommended), or Python 3 with the `openai` package
- `GPT_API_KEY` or `OPENAI_API_KEY` for GPT Image generation
- Internet access for store research and the OpenAI Images API

## Usage

Open the mobile app or landing-page project in your coding agent and say:

```text
SEO optimize my app landing page
```

The SEO skill handles store research, keyword selection, static landing-page implementation, guide content, structured data, copy editing, and verification. When it reaches guide feature images, it loads and follows the separately installed `gpt-image` skill.

For standalone image work, invoke `gpt-image` directly.

## Package structure

```text
bin/
  install.mjs
skill/
  app-landing-seo/
    SKILL.md
  gpt-image/
    SKILL.md
    requirements.txt
    scripts/
      generate_image.py
package.json
```

## License

MIT
