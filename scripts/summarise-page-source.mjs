#!/usr/bin/env node
/**
 * Prints a compact view of every page source saved for a failed test: one line per
 * element that carries an id, accessibility label or text, with its bounds. Makes CI
 * failures readable straight from the job log.
 *
 * Usage: node scripts/summarise-page-source.mjs reports/mobile/artifacts
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'reports/mobile/artifacts';
if (!existsSync(dir)) {
  console.log(`No artifacts directory at ${dir}`);
  process.exit(0);
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? '';

for (const file of readdirSync(dir).filter((f) => f.endsWith('.xml'))) {
  console.log(`\n===== ${file} =====`);
  const tags = readFileSync(join(dir, file), 'utf8').match(/<[A-Za-z][^>]*>/g) ?? [];
  for (const tag of tags) {
    const type = tag.match(/^<([^\s>]+)/)?.[1] ?? '';
    const id = attr(tag, 'resource-id') || attr(tag, 'name');
    const label = attr(tag, 'content-desc') || attr(tag, 'label');
    const text = attr(tag, 'text') || attr(tag, 'value');
    if (!id && !label && !text) continue;
    const bounds =
      attr(tag, 'bounds') ||
      `[${attr(tag, 'x')},${attr(tag, 'y')} ${attr(tag, 'width')}x${attr(tag, 'height')}]`;
    console.log(
      [
        type.split('.').pop(),
        id && `id=${id}`,
        label && `desc=${label}`,
        text && `text=${text}`,
        bounds,
      ]
        .filter(Boolean)
        .join(' | '),
    );
  }
}
