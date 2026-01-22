import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function clean() {
  const dirsToClean = [
    path.resolve(__dirname, '../extension'),
    path.resolve(__dirname, '../dist')
  ];

  for (const dir of dirsToClean) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      console.log(`✅ Cleaned ${path.basename(dir)}/`);
    } catch (error) {
      // Ignore if directory doesn't exist
      if (error.code !== 'ENOENT') {
        console.error(`❌ Failed to clean ${dir}:`, error);
      }
    }
  }
}

clean();
