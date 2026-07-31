import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const iconsDir = join(publicDir, 'icons');
const source = join(iconsDir, 'icon-512.png');

const brandBg = { r: 201, g: 199, b: 245 };

async function main() {
  const { width, height } = await sharp(source).metadata();
  const size = Math.min(width, height);

  // Center-crop favicon to a square
  const square = await sharp(source)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  // Regular icons
  for (const s of [192, 512]) {
    await sharp(square).resize(s, s).png().toFile(join(iconsDir, `icon-${s}.png`));
  }

  // Apple touch icon
  await sharp(square).resize(180, 180).png().toFile(join(iconsDir, 'apple-touch-icon.png'));

  // Maskable icon: favicon scaled to 60% on a brand-colored background
  const pad = Math.round(size * 0.2);
  const canvas = Math.round(size * 1.6667);
  const inner = Math.round(canvas * 0.6);
  await sharp(square)
    .resize(inner, inner)
    .png()
    .toBuffer()
    .then(async (buf) => {
      const icon = await sharp(buf)
        .resize(inner, inner)
        .png()
        .toBuffer();
      await sharp({
        create: {
          width: canvas,
          height: canvas,
          channels: 4,
          background: brandBg,
        },
      })
        .composite([{ input: icon, gravity: 'center' }])
        .resize(512, 512)
        .png()
        .toFile(join(iconsDir, 'maskable-512.png'));
    });

  console.log('Icons generated in', iconsDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
