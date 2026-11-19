import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Loads an optional `.env` file from the project root so local, machine-specific
 * values (device UDIDs, app paths) never have to be committed.
 */
const envFile = resolve(process.cwd(), '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

/** Returns the trimmed value of an environment variable, or `undefined` when empty. */
export function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Returns an environment variable or the provided fallback. */
export function envOr(name: string, fallback: string): string {
  return env(name) ?? fallback;
}

/** Parses a boolean flag (`true`, `1`, `yes`). */
export function envFlag(name: string): boolean {
  return ['true', '1', 'yes'].includes((env(name) ?? '').toLowerCase());
}

export const isCI = envFlag('CI');
