#!/usr/bin/env node
// Register this marketplace and enable its plugins in Claude Code settings.json.
// Run: node setup.mjs   (then restart Claude Code). Safe to re-run; keeps your other settings.
// mattpo is listed in the marketplace and is not enabled here. Install it explicitly.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const file = path.join(dir, 'settings.json');
const gh = (repo) => ({ source: { source: 'github', repo } });

const marketplaces = {
  'yra-skills-public': gh('yravg/yra-skills-public'),
  'claude-plugins-official': gh('anthropics/claude-plugins-official'),
  caveman: gh('JuliusBrussee/caveman'),
  ponytail: gh('DietrichGebert/ponytail'),
  hyperframes: gh('heygen-com/hyperframes'),
  'claude-kit': gh('johnnyvizz/claude-kit'),
  'hellosverre-mods': gh('hellosverre/claude-skins'),
  'claude-code-mods': gh('karanb192/claude-code-mods'),
  'claude-reflect-marketplace': gh('bayramannakov/claude-reflect'),
  'claude-code-filetree': gh('data-goblin/claude-code-filetree'),
  'typesafe-ai': gh('typesafe-ai/skills'),
};

const plugins = {
  'caveman@caveman': true,
  'ponytail@ponytail': true,
  'hyperframes@hyperframes': false,
  'savvy-progress@claude-kit': true,
  'skins@hellosverre-mods': false,
  'reflect-mod@claude-reflect-marketplace': true,
  'filetree@claude-code-filetree': true,
  'cache-tax@claude-code-mods': true,
  'typesafe@typesafe-ai': true,
  'hostinger@claude-plugins-official': true,
  'captureall@yra-skills-public': true,
  'tastestack@yra-skills-public': true,
  'yravglive@yra-skills-public': true,
  'spec-to-canvas@yra-skills-public': true,
  'canvas-to-app@yra-skills-public': true,
  'yra-extras@yra-skills-public': true,
  'yravgbuilder@yra-skills-public': true,
};

let settings = {};
if (fs.existsSync(file)) {
  const raw = fs.readFileSync(file, 'utf8');
  try { settings = JSON.parse(raw); }
  catch (e) { console.error(`settings.json is not valid JSON, not touching it: ${file}\n${e.message}`); process.exit(1); }
  fs.writeFileSync(`${file}.bak`, raw);
} else {
  fs.mkdirSync(dir, { recursive: true });
}

settings.extraKnownMarketplaces = { ...settings.extraKnownMarketplaces, ...marketplaces };
settings.enabledPlugins = { ...settings.enabledPlugins, ...plugins };
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');

console.log(`updated ${file} (${Object.keys(marketplaces).length} marketplaces, ${Object.keys(plugins).length} plugins)`);
console.log('next: restart Claude Code; run install.sh or install.ps1 for loose skills.');
