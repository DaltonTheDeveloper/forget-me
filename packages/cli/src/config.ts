/**
 * Resolves the forget-me API base URL.
 *
 * Precedence (highest first):
 *   1. Env var  FORGETME_API_URL
 *   2. ~/.forgetme/config.json  ->  { "apiBaseUrl": "..." }
 *   3. Default  http://localhost:3001
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

export const DEFAULT_API_URL = "http://localhost:3001";

export const CONFIG_DIR = join(homedir(), ".forgetme");
export const CONFIG_PATH = join(CONFIG_DIR, "config.json");

/** Strip a single trailing slash so we can safely concatenate paths. */
function normalize(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export type ConfigSource = "env" | "file" | "default";

export interface ResolvedConfig {
  apiBaseUrl: string;
  source: ConfigSource;
}

export function readConfigFile(): { apiBaseUrl?: string } | null {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function resolveConfig(): ResolvedConfig {
  const env = process.env.FORGETME_API_URL;
  if (env && env.trim()) {
    return { apiBaseUrl: normalize(env), source: "env" };
  }

  const file = readConfigFile();
  if (file?.apiBaseUrl && file.apiBaseUrl.trim()) {
    return { apiBaseUrl: normalize(file.apiBaseUrl), source: "file" };
  }

  return { apiBaseUrl: DEFAULT_API_URL, source: "default" };
}

export function getApiBaseUrl(): string {
  return resolveConfig().apiBaseUrl;
}

/** Persist the API base URL to ~/.forgetme/config.json. */
export function writeApiBaseUrl(url: string): string {
  const normalized = normalize(url);
  const existing = readConfigFile() ?? {};
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(
    CONFIG_PATH,
    JSON.stringify({ ...existing, apiBaseUrl: normalized }, null, 2) + "\n",
    "utf8",
  );
  return normalized;
}
