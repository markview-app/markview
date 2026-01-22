import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function syncManifestVersion() {
  try {
    // Read package.json
    const packageJson = JSON.parse(
      await fs.readFile(path.resolve(__dirname, '../package.json'), 'utf-8')
    );

    // Read manifest.json
    const manifestPath = path.resolve(__dirname, '../src/manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    // Update version
    manifest.version = packageJson.version;

    // Write back
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    console.log(`✅ Manifest version synced to ${packageJson.version}`);
  } catch (error) {
    console.error('❌ Failed to sync manifest version:', error);
    process.exit(1);
  }
}

syncManifestVersion();
