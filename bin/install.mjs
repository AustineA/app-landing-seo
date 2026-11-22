#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_TITLE = "App Landing SEO";
const REPO = "AustineA/app-landing-seo";
const SKILLS = ["app-landing-seo", "gpt-image"];
const NEXT_STEP = "open your app or landing-page project and say \"SEO optimize my app landing page\" (the SEO skill calls gpt-image for guide feature images)";
const INSTALL_HOME = process.env.SKILL_INSTALL_HOME
  ? resolve(process.env.SKILL_INSTALL_HOME)
  : homedir();
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOT = join(PACKAGE_ROOT, "skill");
const CANONICAL_ROOT = join(INSTALL_HOME, ".agents", "skills");
const STAMP_FILE = ".installed.json";
const { name: PACKAGE_NAME, version: PACKAGE_VERSION } = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"),
);

const AGENTS = [
  { name: "Claude Code", dir: join(INSTALL_HOME, ".claude", "skills") },
  { name: "Codex", dir: join(INSTALL_HOME, ".codex", "skills") },
  { name: "Cursor", dir: join(INSTALL_HOME, ".cursor", "skills") },
  { name: "Windsurf", dir: join(INSTALL_HOME, ".windsurf", "skills") },
  { name: "Antigravity", dir: join(INSTALL_HOME, ".antigravity", "skills") },
  { name: "Trae", dir: join(INSTALL_HOME, ".trae", "skills") },
  { name: "Amp", dir: join(INSTALL_HOME, ".amp", "skills") },
];

const command = process.argv[2] || "install";
const success = (message) => console.log(`  ✅ ${message}`);
const skip = (message) => console.log(`  ⏭️  ${message}`);
const warn = (message) => console.log(`  ⚠️  ${message}`);

function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

// The commit this copy of the package came from: npx records it in the lockfile
// next to node_modules; a local clone has it in git.
function packageCommit() {
  const lockfiles = [
    join(PACKAGE_ROOT, "..", ".package-lock.json"),
    join(PACKAGE_ROOT, "..", "..", "package-lock.json"),
  ];
  for (const lockfile of lockfiles) {
    const lock = readJson(lockfile);
    const resolved = lock?.packages?.[`node_modules/${PACKAGE_NAME}`]?.resolved;
    const match = resolved?.match(/#([0-9a-f]{40})$/);
    if (match) return match[1];
  }
  const git = spawnSync("git", ["rev-parse", "HEAD"], { cwd: PACKAGE_ROOT, encoding: "utf8" });
  return git.status === 0 ? git.stdout.trim() : null;
}

function installedStamp(skillName) {
  return readJson(join(CANONICAL_ROOT, skillName, STAMP_FILE));
}

function installSkill(skillName, stamp) {
  const source = join(SOURCE_ROOT, skillName);
  const destination = join(CANONICAL_ROOT, skillName);
  if (!existsSync(join(source, "SKILL.md"))) {
    throw new Error(`Packaged skill is missing SKILL.md: ${source}`);
  }
  // Replace rather than merge, so files removed upstream don't linger.
  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, { recursive: true });
  writeFileSync(join(destination, STAMP_FILE), `${JSON.stringify(stamp, null, 2)}\n`);
  success(`${skillName} installed to ~/.agents/skills/${skillName} (${shortCommit(stamp.commit)})`);
}

function shortCommit(commit) {
  return commit ? commit.slice(0, 7) : "unknown commit";
}

function linkSkill(agent, skillName) {
  const target = join(CANONICAL_ROOT, skillName);
  const linkPath = join(agent.dir, skillName);
  if (pathExists(linkPath)) {
    try {
      const currentTarget = readlinkSync(linkPath);
      if (resolve(dirname(linkPath), currentTarget) === target) {
        skip(`${agent.name}: ${skillName} already linked`);
        return true;
      }
      unlinkSync(linkPath);
    } catch {
      warn(`${agent.name}: ${linkPath} exists and is not a symlink; skipping`);
      return false;
    }
  }
  symlinkSync(target, linkPath);
  success(`${agent.name}: ${skillName} → ~/.agents/skills/${skillName}`);
  return true;
}

function install() {
  console.log(`\n📦 Installing ${PACKAGE_TITLE}...\n`);
  mkdirSync(CANONICAL_ROOT, { recursive: true });
  const stamp = {
    version: PACKAGE_VERSION,
    commit: packageCommit(),
    installedAt: new Date().toISOString(),
  };
  for (const skillName of SKILLS) installSkill(skillName, stamp);

  console.log("\n🔗 Linking to agents...\n");
  let linked = 0;
  for (const agent of AGENTS) {
    const agentRoot = resolve(agent.dir, "..");
    if (!existsSync(agentRoot)) {
      skip(`${agent.name} not found`);
      continue;
    }
    mkdirSync(agent.dir, { recursive: true });
    for (const skillName of SKILLS) {
      if (linkSkill(agent, skillName)) linked += 1;
    }
  }

  console.log(`\n🎉 Done! Installed ${SKILLS.length} skill(s) and created ${linked} link(s).\n`);
  if (NEXT_STEP) console.log(`Next, ${NEXT_STEP}\n`);
}

function uninstall() {
  console.log(`\n🗑️  Uninstalling ${PACKAGE_TITLE}...\n`);
  for (const agent of AGENTS) {
    for (const skillName of SKILLS) {
      const linkPath = join(agent.dir, skillName);
      if (!pathExists(linkPath)) continue;
      try {
        readlinkSync(linkPath);
        unlinkSync(linkPath);
        success(`Removed ${agent.name}: ${skillName}`);
      } catch {
        skip(`${agent.name}: ${skillName} is not a symlink; leaving it`);
      }
    }
  }

  for (const skillName of SKILLS) {
    const destination = join(CANONICAL_ROOT, skillName);
    if (existsSync(destination)) {
      rmSync(destination, { recursive: true, force: true });
      success(`Removed ~/.agents/skills/${skillName}`);
    }
  }
  console.log("\n✅ Uninstalled.\n");
}

function status() {
  console.log(`\n📊 ${PACKAGE_TITLE} status\n`);
  for (const skillName of SKILLS) {
    const destination = join(CANONICAL_ROOT, skillName);
    if (existsSync(destination)) {
      const stamp = installedStamp(skillName);
      const detail = stamp ? ` (${shortCommit(stamp.commit)}, ${stamp.installedAt.slice(0, 10)})` : "";
      success(`${skillName} installed at ~/.agents/skills/${skillName}${detail}`);
      const files = readdirSync(destination).filter((file) => file !== STAMP_FILE);
      console.log(`  Files: ${files.join(", ")}`);
    } else {
      warn(`${skillName} not installed`);
    }
  }

  console.log();
  for (const agent of AGENTS) {
    const installed = SKILLS.filter((skillName) => pathExists(join(agent.dir, skillName)));
    if (installed.length > 0) success(`${agent.name}: ${installed.join(", ")}`);
    else if (existsSync(resolve(agent.dir, ".."))) skip(`${agent.name}: not linked`);
  }
  console.log();
}

const GIT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: "0" };

// Latest commit on GitHub, and a remote URL that works for this user: SSH, then HTTPS.
function latestRemote() {
  for (const url of [`git@github.com:${REPO}.git`, `https://github.com/${REPO}.git`]) {
    const result = spawnSync("git", ["ls-remote", url, "HEAD"], {
      encoding: "utf8",
      env: GIT_ENV,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const match = result.stdout?.match(/^([0-9a-f]{40})\s+HEAD/m);
    if (match) return { url, commit: match[1] };
  }
  return null;
}

function update() {
  console.log(`\n🔄 Updating ${PACKAGE_TITLE}...\n`);
  const remote = latestRemote();
  if (!remote) {
    warn(`Couldn't reach github.com/${REPO}. Check you have access (SSH key or gh auth login).`);
    process.exitCode = 1;
    return;
  }

  const latest = remote.commit;
  const installed = SKILLS.map(installedStamp);
  if (installed.every((stamp) => stamp?.commit === latest)) {
    success(`Already up to date (${shortCommit(latest)})\n`);
    return;
  }

  const current = installed[0]?.commit;
  console.log(`  ${current ? shortCommit(current) : "Not installed"} → ${shortCommit(latest)}`);
  if (latest === packageCommit()) {
    install();
    return;
  }

  // Run the latest installer from a fresh clone; npx can hand back a cached copy.
  const checkout = mkdtempSync(join(tmpdir(), `${PACKAGE_NAME}-`));
  try {
    const clone = spawnSync("git", ["clone", "--quiet", "--depth", "1", remote.url, checkout], {
      env: GIT_ENV,
      stdio: "inherit",
    });
    if (clone.status !== 0) {
      warn(`Couldn't download the latest version from github.com/${REPO}.`);
      process.exitCode = 1;
      return;
    }
    const result = spawnSync(process.execPath, [join(checkout, "bin", "install.mjs"), "install"], {
      stdio: "inherit",
    });
    if (result.status !== 0) process.exitCode = result.status ?? 1;
  } finally {
    rmSync(checkout, { recursive: true, force: true });
  }
}

function help() {
  console.log(`
${PACKAGE_TITLE} installer

Commands:
  install      Install all packaged skills and link detected agents (default)
  update       Install the latest version from GitHub if there's a newer one
  uninstall    Remove managed skills and their links
  status       Show installation and link status
  help         Show this help
`);
}

const commands = { install, update, uninstall, status, help };
if (!commands[command]) {
  warn(`Unknown command: ${command}`);
  help();
  process.exitCode = 1;
} else {
  commands[command]();
}
