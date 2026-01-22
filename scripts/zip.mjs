import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createZip() {
  try {
    // Read version from package.json
    const packageJson = JSON.parse(
      await fs.readFile(path.resolve(__dirname, '../package.json'), 'utf-8')
    );

    const version = packageJson.version;
    const distDir = path.resolve(__dirname, '../dist');
    const zipPath = path.resolve(distDir, `markview-${version}.zip`);

    // Ensure dist directory exists
    await fs.mkdir(distDir, { recursive: true });

    // Create write stream
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Pipe archive to file
    archive.pipe(output);

    // Add extension directory to archive
    archive.directory(path.resolve(__dirname, '../extension'), false);

    // Finalize
    await archive.finalize();

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
    });

    const fileSize = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`✅ Created ${zipPath} (${fileSize} MB)`);
  } catch (error) {
    console.error('❌ Failed to create zip:', error);
    process.exit(1);
  }
}

createZip();
