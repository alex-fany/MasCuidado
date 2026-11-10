const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { receiveBackupFile } = require('../src/middlewares/backupFile');
const { LIMITS } = require('../src/validators/petBackupValidator');

function multipart(parts) {
  const boundary = 'safe-backup-test';
  const chunks = parts.flatMap(part => [Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"${part.filename ? `; filename="${part.filename}"` : ''}\r\n${part.filename ? 'Content-Type: application/json\r\n' : ''}\r\n`),
    Buffer.isBuffer(part.content) ? part.content : Buffer.from(part.content), Buffer.from('\r\n')]);
  chunks.push(Buffer.from(`--${boundary}--\r\n`)); const bytes = Buffer.concat(chunks);
  const req = Readable.from([bytes]); req.headers = { 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': String(bytes.length) };
  req.is = type => type === 'multipart/form-data'; return req;
}
function run(req) {
  return new Promise((resolve, reject) => {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { resolve({ req, status: this.statusCode, body, next: false }); } };
    receiveBackupFile(req, res, error => { if (error) reject(error); else resolve({ req, next: true }); });
  });
}
test('JSON compatibility bypasses multipart parser', async () => {
  const result = await run({ is: () => false, body: {} }); assert.equal(result.next, true);
});
test('accepts single bounded backup buffer without disk, network or image APIs', async () => {
  const result = await run(multipart([{ name: 'backup', filename: 'backup.json', content: '{"version":2}' }]));
  assert.equal(result.next, true); assert.equal(result.req.file.buffer.toString(), '{"version":2}'); assert.equal(result.req.file.path, undefined);
});
test('rejects owner text fields instead of merging with authenticated identity', async () => {
  const result = await run(multipart([{ name: 'usuarioId', content: 'kevin' }])); assert.equal(result.status, 400); assert.equal(result.next, false);
});
test('rejects wrong file field', async () => {
  const result = await run(multipart([{ name: 'image', filename: 'file.json', content: '{}' }])); assert.equal(result.status, 400);
});
test('rejects more than one file', async () => {
  const result = await run(multipart([{ name: 'backup', filename: 'a.json', content: '{}' }, { name: 'backup', filename: 'b.json', content: '{}' }]));
  assert.equal(result.status, 400);
});
test('rejects file beyond 20 MiB with HTTP 413', async () => {
  const result = await run(multipart([{ name: 'backup', filename: 'big.json', content: Buffer.alloc(LIMITS.fileBytes + 1) }])); assert.equal(result.status, 413);
});
test('concurrent multipart admission is bounded before buffering large files', async () => {
  const boundary = 'bounded-reception';
  const bytes = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="backup"; filename="a.json"\r\nContent-Type: application/json\r\n\r\n{}\r\n--${boundary}--\r\n`);
  const pending = () => {
    const req = new Readable({ read() {} }); req.headers = { 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': String(bytes.length) };
    req.is = () => true; return req;
  };
  const first = pending(), second = pending(); const a = run(first), b = run(second);
  const third = await run(pending()); assert.equal(third.status, 429); assert.equal(third.body.code, 'BACKUP_BUSY');
  first.push(bytes); first.push(null); second.push(bytes); second.push(null);
  assert.equal((await a).next, true); assert.equal((await b).next, true);
});
