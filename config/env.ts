import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Machine-specific values (device UDIDs, app paths, credentials) live in an uncommitted .env.
const envFile = resolve(process.cwd(), '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function envOr(name: string, fallback: string): string {
  return env(name) ?? fallback;
}

export function envFlag(name: string): boolean {
  return ['true', '1', 'yes'].includes((env(name) ?? '').toLowerCase());
}

export const isCI = envFlag('CI');
