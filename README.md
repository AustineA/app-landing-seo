# App Landing SEO Skills

A Git-installable repository containing two separate skills:

- **`app-landing-seo`** researches, writes, builds, and validates an SEO landing site for a mobile app.
- **`gpt-image`** generates and edits images with OpenAI's `gpt-image-2` model.

The SEO skill explicitly calls the GPT Image skill to create one landscape feature image for every guide article. The image skill remains independently usable for other image-generation tasks.

## Repository layout

```text
skills/
  app-landing-seo/
    SKILL.md
  gpt-image/
    SKILL.md
    requirements.txt
    scripts/
      generate_image.py
```

## Installation

Install both skill paths from this repository. They must remain separate sibling skills in the destination skill directory.

### Codex

Ask Codex to install both skills from the repository URL, or use the skill installer pattern:

```bash
install-skill-from-github.py \
  --repo <owner>/app-landing-seo \
  --path skills/app-landing-seo skills/gpt-image
```

The installer places them at:

```text
<skills-directory>/app-landing-seo/
<skills-directory>/gpt-image/
```

### Claude Code

Following the same Git installation pattern as the ASO skill, install each skill directory from the pushed repository:

```bash
claude install-skill github.com/<owner>/app-landing-seo/tree/main/skills/app-landing-seo
claude install-skill github.com/<owner>/app-landing-seo/tree/main/skills/gpt-image
```

## GPT Image requirements

- `uv` (recommended), or Python 3 with `openai` installed from `skills/gpt-image/requirements.txt`
- `GPT_API_KEY` or `OPENAI_API_KEY`
- Internet access to the OpenAI Images API

## Usage

Run `/app-landing-seo` from the app or landing-page repository to execute the complete SEO workflow. The skill loads `gpt-image` when it reaches guide feature-image generation.

Run `/gpt-image` directly for standalone image generation or image editing.

## License

MIT
