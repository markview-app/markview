import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Returns `jsonText` with its top-level `version` set to `version`. Only the
 * value is replaced: re-serialising the whole manifest with JSON.stringify
 * rewrote its short arrays one item per line on every build, so the file left
 * Prettier's format and showed as modified after every `pnpm run build`.
 */
function replaceVersionField(jsonText, version) {
  // "manifest_version" cannot match: its value is unquoted, and the pattern
  // requires a quote directly before `version`.
  const updatedText = jsonText.replace(/("version":\s*")[^"]*(")/, `$1${version}$2`);
  if (JSON.parse(updatedText).version !== version) {
    throw new Error('version replacement did not apply — check the shape of src/manifest.json');
  }
  return updatedText;
}

async function syncManifestVersion() {
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.resolve(__dirname, '../package.json'), 'utf-8')
    );
    const manifestPath = path.resolve(__dirname, '../src/manifest.json');
    const manifestText = await fs.readFile(manifestPath, 'utf-8');
    const updatedText = replaceVersionField(manifestText, packageJson.version);

    if (updatedText !== manifestText) {
      await fs.writeFile(manifestPath, updatedText);
    }

    console.log(`✅ Manifest version synced to ${packageJson.version}`);
  } catch (error) {
    console.error('❌ Failed to sync manifest version:', error);
    process.exit(1);
  }
}

syncManifestVersion();
