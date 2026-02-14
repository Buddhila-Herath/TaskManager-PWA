/**
 * Creates placeholder PWA screenshots for richer install UI.
 * Run from frontend folder: node scripts/create-pwa-screenshots.js
 * Replace these with real app screenshots later.
 */
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");

async function main() {
  const sharp = require("sharp");

  const placeholder = { r: 30, g: 41, b: 59 }; // slate-800

  await sharp({
    create: { width: 1280, height: 720, channels: 3, background: placeholder },
  })
    .png()
    .toFile(path.join(publicDir, "screenshot-wide.png"));
  console.log("Created screenshot-wide.png (1280x720)");

  await sharp({
    create: { width: 750, height: 1334, channels: 3, background: placeholder },
  })
    .png()
    .toFile(path.join(publicDir, "screenshot-narrow.png"));
  console.log("Created screenshot-narrow.png (750x1334)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
