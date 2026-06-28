import { readFileSync, watch } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = resolve(__dirname, '..', 'config.json');

function loadFromDisk() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (err) {
    console.error(`[ConfigLoader] Failed to load config.json: ${err.message}`);
    return { servers: {} };
  }
}

let currentConfig = loadFromDisk();

// Re-read config.json into memory whenever it changes on disk.
// This is why fs.watch is used: requests read from the in-memory object (fast),
// and fs.watch triggers a reload only on actual file changes — no restart needed.
watch(CONFIG_PATH, (eventType) => {
  if (eventType === 'change') {
    const updated = loadFromDisk();
    if (Object.keys(updated.servers).length > 0) {
      currentConfig = updated;
      console.log(`[ConfigLoader] Config reloaded — active servers: ${Object.keys(currentConfig.servers).join(', ')}`);
    } else {
      console.warn('[ConfigLoader] Reload skipped — new config has no servers or failed to parse, keeping previous config.');
    }
  }
});

export function getConfig() {
  return currentConfig;
}
