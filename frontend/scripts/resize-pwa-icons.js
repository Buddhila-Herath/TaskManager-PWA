/**
 * Resizes the source PWA icon to 192x192 and 512x512.
 * Run from repo root: node scripts/resize-pwa-icons.js
 * Requires: npm install sharp (run from frontend folder)
 */
const path = require("path");
const fs = require("fs");

const publicDir = path.join(__dirname, "..", "public");
const sourcePath = path.join(publicDir, "icon-512x512.png");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("Run in frontend folder: npm install --save-dev sharp");
    process.exit(1);
  }

  if (!fs.existsSync(sourcePath)) {
    console.error("Source icon not found:", sourcePath);
    process.exit(1);
  }

  await sharp(sourcePath)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, "icon-192x192.png"));
  console.log("Created icon-192x192.png");

  const tmp512 = path.join(publicDir, "icon-512x512.tmp.png");
  await sharp(sourcePath)
    .resize(512, 512)
    .png()
    .toFile(tmp512);
  fs.renameSync(tmp512, path.join(publicDir, "icon-512x512.png"));
  console.log("Created icon-512x512.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
