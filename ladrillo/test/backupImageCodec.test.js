const { test } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { randomBytes } = require('node:crypto');
const { normalizeImage } = require('../src/services/backupImageCodec');
const { LIMITS } = require('../src/validators/petBackupValidator');

for (const [format, mime] of [['png', 'image/png'], ['jpeg', 'image/jpeg'], ['webp', 'image/webp']]) {
  test(`fully decodes synthetic ${format} and returns lossless PNG without metadata`, async () => {
    const source = await sharp({ create: { width: 3, height: 2, channels: 3, background: '#26aa77' } }).withExif({ IFD0: { Artist: 'test-only' } }).toFormat(format).toBuffer();
    const result = await normalizeImage(source, mime); const metadata = await sharp(result.bytes).metadata();
    assert.equal(result.mimeType, 'image/png'); assert.equal(metadata.width, 3); assert.equal(metadata.height, 2);
    assert.equal(metadata.exif, undefined);
  });
}
test('header-only fake PNG is rejected by full decoder', async () => {
  await assert.rejects(normalizeImage(Buffer.from('89504e470d0a1a0a', 'hex'), 'image/png'), e => e.code === 'IMAGE_DECODE_FAILED');
});
test('truncated PNG/JPEG/WebP and deceptive MIME fail', async () => {
  for (const [format, mime] of [['png', 'image/png'], ['jpeg', 'image/jpeg'], ['webp', 'image/webp']]) {
    const b = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'red' } }).toFormat(format).toBuffer();
    await assert.rejects(normalizeImage(b.subarray(0, Math.floor(b.length / 2)), mime));
    await assert.rejects(normalizeImage(b, mime === 'image/png' ? 'image/jpeg' : 'image/png'), e => e.code === 'IMAGE_FORMAT');
  }
});
test('malicious SVG and appended payload are not preserved', async () => {
  await assert.rejects(normalizeImage(Buffer.from('<svg onload="alert(1)"></svg>'), 'image/svg+xml'), e => e.code === 'IMAGE_FORMAT');
  const b = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'blue' } }).png().toBuffer();
  const result = await normalizeImage(Buffer.concat([b, Buffer.from('<script>malicious</script>')]), 'image/png');
  assert.equal(result.bytes.includes(Buffer.from('malicious')), false);
});
test('compressed pixel bomb rejected even though compressed bytes are tiny', async () => {
  const b = await sharp({ create: { width: 3000, height: 3000, channels: 3, background: 'white' } }).png().toBuffer();
  assert.ok(b.length < LIMITS.imageBytes);
  await assert.rejects(normalizeImage(b, 'image/png'));
});
test('maximum individual dimension checked independently of pixel count', async () => {
  const b = await sharp({ create: { width: 8193, height: 1, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(normalizeImage(b, 'image/png'), e => e.code === 'IMAGE_DIMENSIONS');
});
test('empty and oversized buffers rejected before decoding', async () => {
  for (const b of [Buffer.alloc(0), Buffer.alloc(LIMITS.imageBytes + 1)]) await assert.rejects(normalizeImage(b, 'image/png'), e => e.code === 'IMAGE_SIZE');
});
test('PNG normalization cannot expand a small JPEG beyond the byte limit', async () => {
  const b = await sharp(randomBytes(2000 * 1000 * 3), { raw: { width: 2000, height: 1000, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();
  assert.ok(b.length < LIMITS.imageBytes);
  await assert.rejects(normalizeImage(b, 'image/jpeg'), e => e.code === 'IMAGE_SIZE');
});
test('animated WebP is rejected rather than silently losing frames', async () => {
  const pixels = Buffer.from([255, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0, 255]);
  const b = await sharp(pixels, { raw: { width: 2, height: 4, channels: 3, pageHeight: 2 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  assert.equal((await sharp(b).metadata()).pages, 2);
  await assert.rejects(normalizeImage(b, 'image/webp'), e => e.code === 'IMAGE_DIMENSIONS');
});
