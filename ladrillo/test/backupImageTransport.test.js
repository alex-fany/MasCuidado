const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const { EventEmitter } = require('node:events');
const { allowedCloudinaryUrl, createImageDownloader, createCloudinaryImageStore } = require('../src/services/backupImageTransport');
const { LIMITS } = require('../src/validators/petBackupValidator');
const url = 'https://res.cloudinary.com/example/image/upload/v123/mascotas/photo.png';
const publicId = 'mascuidado/backups/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222';

for (const value of ['http://res.cloudinary.com/example/image/upload/v123/a.png', 'https://127.0.0.1/a.png',
  'https://res.cloudinary.com.evil.test/example/image/upload/v1/a.png', 'https://user:pass@res.cloudinary.com/example/image/upload/v1/a.png',
  'https://res.cloudinary.com/other/image/upload/v1/a.png', 'https://res.cloudinary.com/example/image/fetch/v1/a.png',
  'https://res.cloudinary.com/example/image/upload/w_100/v1/a.png', url + '?token=secret', url + '#fragment',
  'https://res.cloudinary.com:444/example/image/upload/v1/a.png', 'https://res.cloudinary.com/example/image/upload/v1/%2e%2e/a.png',
  'https://res.cloudinary.com/example/image/upload/v1/../v2/a.png', 'https://res.cloudinary.com/example/image/upload/v1/a.svg',
  '/uploads/photo.png']) {
  test(`rejects unsafe source #${value.length}-${value.slice(-12)}`, () => assert.throws(() => allowedCloudinaryUrl(value, 'example'), e => e.code === 'IMAGE_SOURCE_FORBIDDEN'));
}
test('does not expose configuration values or allow absent cloud name', () => assert.throws(() => allowedCloudinaryUrl(url), e => e.code === 'IMAGE_STORAGE_NOT_CONFIGURED'));

function transport({ status = 200, headers = { 'content-type': 'image/png' }, chunks = [Buffer.from('synthetic')], addresses = ['93.184.216.34'] } = {}) {
  const calls = []; let destroyed = false;
  const download = createImageDownloader({ cloudName: 'example', lookup: async (_host, options) => {
    assert.equal(options.family, 4); return addresses.map(address => ({ address, family: 4 }));
  }, request: (target, options, callback) => {
    calls.push({ target, options }); const req = new EventEmitter();
    options.lookup('res.cloudinary.com', {}, (error, address, family) => { assert.equal(error, null); assert.equal(address, addresses[0]); assert.equal(family, 4); });
    req.destroy = () => { destroyed = true; return req; };
    req.end = () => queueMicrotask(() => { const res = Readable.from(chunks); res.statusCode = status; res.headers = headers; callback(res); });
    return req;
  } });
  return { download, calls, destroyed: () => destroyed };
}
test('safe download pins public DNS, verifies TLS by default and sends no credentials', async () => {
  const t = transport(); const result = await t.download(url);
  assert.equal(result.bytes.toString(), 'synthetic'); assert.equal(result.mimeType, 'image/png');
  assert.equal(t.calls[0].options.agent, false); assert.notEqual(t.calls[0].options.rejectUnauthorized, false);
  assert.equal(t.calls[0].options.headers.Authorization, undefined); assert.equal(t.calls.length, 1);
});
for (const address of ['127.0.0.1', '10.1.1.1', '169.254.169.254', '172.16.0.1', '192.168.0.1', '100.64.1.1', '0.0.0.0', '224.0.0.1', '::1', '::ffff:127.0.0.1']) {
  test(`blocks DNS resolution to ${address}`, async () => {
    const t = transport({ addresses: [address] }); await assert.rejects(t.download(url), e => e.code === 'IMAGE_ADDRESS_FORBIDDEN'); assert.deepEqual(t.calls, []);
  });
}
test('mixed public/private DNS response is rejected before socket creation', async () => {
  const t = transport({ addresses: ['93.184.216.34', '127.0.0.1'] }); await assert.rejects(t.download(url), e => e.code === 'IMAGE_ADDRESS_FORBIDDEN'); assert.equal(t.calls.length, 0);
});
test('redirects including redirects to metadata addresses are never followed', async () => {
  const t = transport({ status: 302, headers: { location: 'http://169.254.169.254/private' } });
  await assert.rejects(t.download(url), e => e.code === 'IMAGE_DOWNLOAD_STATUS'); assert.equal(t.calls.length, 1); assert.equal(t.destroyed(), true);
});
test('missing source, remote MIME and content encoding errors fail explicitly', async () => {
  for (const t of [transport({ status: 404 }), transport({ headers: { 'content-type': 'text/html' } }),
    transport({ headers: { 'content-type': 'image/png', 'content-encoding': 'gzip' } })]) await assert.rejects(t.download(url));
});
test('declared and streamed oversize and truncated response are bounded', async () => {
  const cases = [
    transport({ headers: { 'content-type': 'image/png', 'content-length': String(LIMITS.imageBytes + 1) } }),
    transport({ chunks: [Buffer.alloc(LIMITS.imageBytes), Buffer.from('x')] }),
    transport({ headers: { 'content-type': 'image/png', 'content-length': '999' } }), transport({ chunks: [] })
  ];
  for (const t of cases) await assert.rejects(t.download(url), e => e.code === 'IMAGE_SIZE');
});
test('DNS failures and DNS deadline are safe errors with no URL or credentials', async () => {
  for (const lookup of [async () => { throw new Error('secret'); }, () => new Promise(() => {})]) {
    const download = createImageDownloader({ cloudName: 'example', lookup, request: () => { throw new Error('must not request'); } });
    await assert.rejects(download(url, { timeoutMs: 5 }), e => e.code.startsWith('IMAGE_DOWNLOAD') && !e.message.includes('secret'));
  }
});
test('upload always uses new identity and forbids overwrite; cleanup uses the confirmed identity', async () => {
  const calls = [];
  const cloudinary = { uploader: {
    upload_stream(options, callback) { calls.push(options); return new Writable({ write(_chunk, _encoding, done) { done(); },
      final(done) { callback(null, { public_id: options.public_id, resource_type: 'image', type: 'upload', secure_url: 'new-url' }); done(); } }); },
    async destroy(id, options) { calls.push({ id, options }); return { result: 'ok' }; }
  } };
  const store = createCloudinaryImageStore(cloudinary); const resource = await store.upload(Buffer.from('synthetic'), publicId);
  assert.equal(resource.publicId, publicId); assert.equal(calls[0].overwrite, false); assert.equal(calls[0].resource_type, 'image');
  await store.remove(resource.publicId); assert.equal(calls[1].id, publicId);
});
test('unexpected returned public ID never becomes a confirmed resource', async () => {
  const store = createCloudinaryImageStore({ uploader: { upload_stream(_options, callback) {
    return new Writable({ write(_b, _e, done) { callback(null, { public_id: 'original', resource_type: 'image', type: 'upload' }); done(); } });
  } } });
  await assert.rejects(store.upload(Buffer.from('synthetic'), publicId), e => e.code === 'IMAGE_UPLOAD_UNCERTAIN' && e.cleanupRequired);
});
test('upload timeout remains a failed operation with an uncertain outcome, not success', async () => {
  const store = createCloudinaryImageStore({ uploader: { upload_stream() { return new Writable({ write(_b, _e, done) { done(); } }); } } });
  await assert.rejects(store.upload(Buffer.from('synthetic'), publicId, 5), e => e.code === 'IMAGE_UPLOAD_UNCERTAIN' && e.cleanupRequired);
});
test('existing resource collision is not registered as new and cannot be compensated', async () => {
  const store = createCloudinaryImageStore({ uploader: { upload_stream(options, callback) {
    return new Writable({ write(_b, _e, done) { callback(null, { existing: true, public_id: options.public_id, resource_type: 'image', type: 'upload' }); done(); } });
  } } });
  await assert.rejects(store.upload(Buffer.from('x'), publicId), e => e.code === 'IMAGE_ID_COLLISION' && !e.cleanupRequired);
});
test('store refuses upload or cleanup of original IDs even if called incorrectly', async () => {
  const store = createCloudinaryImageStore({ uploader: {} });
  await assert.rejects(store.upload(Buffer.from('x'), 'original-photo'), e => e.code === 'IMAGE_ID_FORBIDDEN');
  await assert.rejects(store.remove('original-photo'), e => e.code === 'IMAGE_ID_FORBIDDEN');
});
test('late confirmation after timeout compensates the confirmed new resource only', async () => {
  let callback; const removed = [];
  const store = createCloudinaryImageStore({ uploader: {
    upload_stream(_options, done) { callback = done; return new Writable({ write(_b, _e, finish) { finish(); } }); },
    async destroy(id) { removed.push(id); return { result: 'ok' }; }
  } });
  await assert.rejects(store.upload(Buffer.from('x'), publicId, 5));
  callback(null, { public_id: publicId, resource_type: 'image', type: 'upload' });
  await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(removed, [publicId]);
});
test('duplicate ordinary success callback never triggers cleanup', async () => {
  let callback; const removed = [];
  const store = createCloudinaryImageStore({ uploader: {
    upload_stream(options, done) { callback = done; return new Writable({ write(_b, _e, finish) {
      done(null, { public_id: options.public_id, resource_type: 'image', type: 'upload' }); finish(); } }); },
    async destroy(id) { removed.push(id); return { result: 'ok' }; }
  } });
  await store.upload(Buffer.from('x'), publicId); callback(null, { public_id: publicId, resource_type: 'image', type: 'upload' });
  await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(removed, []);
});
test('stream with no response data is aborted by the total download deadline', async () => {
  const download = createImageDownloader({ cloudName: 'example', lookup: async () => [{ address: '93.184.216.34', family: 4 }],
    request: (_url, options) => {
      const req = new EventEmitter(); req.destroy = () => {}; req.end = () => {};
      options.signal.addEventListener('abort', () => req.emit('error', new Error('aborted')), { once: true }); return req;
    }
  });
  await assert.rejects(download(url, { timeoutMs: 5 }), e => e.code === 'IMAGE_DOWNLOAD_TIMEOUT');
});
