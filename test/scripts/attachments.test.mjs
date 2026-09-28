import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  MAX_ATTACHMENT_BYTES,
  acceptedExtensions,
  attachmentValue,
  downloadAttachment,
  isGitHubAttachmentUrl,
  matchesExtension,
  shouldDownload,
} from '../../scripts/lib/attachments.mjs';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const HTML = new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e]);

/** DNS stand-in: every hostname resolves to one ordinary public address. */
const PUBLIC_DNS = { lookup: async () => [{ address: '93.184.216.34', family: 4 }] };
/** DNS stand-in for the runner's own metadata service. */
const METADATA_DNS = { lookup: async () => [{ address: '169.254.169.254', family: 4 }] };

function stubResponse(bytes, { ok = true, status = 200, headers = {} } = {}) {
  const table = new Map(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));
  return {
    ok,
    status,
    headers: { get: (name) => table.get(String(name).toLowerCase()) ?? null },
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

function stubFs() {
  const written = new Map();
  return {
    written,
    mkdirSync() {},
    writeFileSync(file, data) {
      written.set(file, data);
    },
  };
}

const base = { destDir: '/repo/catalog/brief', filename: 'deck.pdf', dnsImpl: PUBLIC_DNS };

test('matchesExtension judges the bytes, not the name', () => {
  assert.equal(matchesExtension('.pdf', PDF), true);
  assert.equal(matchesExtension('.pdf', HTML), false);
  assert.equal(matchesExtension('.png', PNG), true);
  assert.equal(matchesExtension('.jpg', PNG), false, 'a PNG must not be committed as a .jpg');
  assert.equal(matchesExtension('.exe', PDF), false);
  assert.equal(matchesExtension('', PDF), false);
});

test('acceptedExtensions is the allowlist the schema may name', () => {
  assert.deepEqual(acceptedExtensions(), ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp']);
});

test('a PDF attachment is written under the name the schema asked for', async () => {
  const fsImpl = stubFs();
  const result = await downloadAttachment('https://example.org/uploads/x', {
    ...base,
    fsImpl,
    fetchImpl: async () => stubResponse(PDF),
  });
  assert.deepEqual(result, { saved: true, bytes: PDF.length, warning: '' });
  assert.deepEqual([...fsImpl.written.keys()], [path.join('/repo/catalog/brief', 'deck.pdf')]);
});

test('a file whose bytes are not a PDF is refused, with a warning and no write', async () => {
  const fsImpl = stubFs();
  const result = await downloadAttachment('https://example.org/uploads/x', {
    ...base,
    fsImpl,
    fetchImpl: async () => stubResponse(HTML),
  });
  assert.equal(result.saved, false);
  assert.match(result.warning, /does not look like PDF/);
  assert.equal(fsImpl.written.size, 0);
});

test('an extension the module cannot verify is refused before any request', async () => {
  let called = false;
  const result = await downloadAttachment('https://example.org/x', {
    ...base,
    filename: 'payload.exe',
    fetchImpl: async () => {
      called = true;
      return stubResponse(PDF);
    },
  });
  assert.equal(result.saved, false);
  assert.equal(called, false, 'nothing is fetched for a name we could never store');
  assert.match(result.warning, /\.pdf, \.png/);
});

test('a host that resolves to the metadata address is never fetched', async () => {
  let called = false;
  const result = await downloadAttachment('https://sneaky.example/deck.pdf', {
    ...base,
    dnsImpl: METADATA_DNS,
    fetchImpl: async () => {
      called = true;
      return stubResponse(PDF);
    },
  });
  assert.equal(result.saved, false);
  assert.equal(called, false);
  assert.match(result.warning, /private address/);
});

test('a redirect is followed by hand and re-checked', async () => {
  const seen = [];
  const fsImpl = stubFs();
  const result = await downloadAttachment('https://example.org/a', {
    ...base,
    fsImpl,
    fetchImpl: async (url) => {
      seen.push(url);
      if (seen.length === 1) {
        return stubResponse(new Uint8Array(), {
          status: 302,
          headers: { location: 'https://cdn.example/b' },
        });
      }
      return stubResponse(PDF);
    },
  });
  assert.equal(result.saved, true);
  assert.deepEqual(seen, ['https://example.org/a', 'https://cdn.example/b']);
});

test('a declared Content-Length over the cap stops before the body is read', async () => {
  const result = await downloadAttachment('https://example.org/x', {
    ...base,
    fetchImpl: async () =>
      stubResponse(PDF, { headers: { 'content-length': String(MAX_ATTACHMENT_BYTES + 1) } }),
  });
  assert.equal(result.saved, false);
  assert.match(result.warning, /25 MB size cap/);
});

test('a body with no Content-Length is capped as it streams', async () => {
  let pulled = 0;
  const chunk = new Uint8Array(1024);
  chunk.set(PDF);
  const body = {
    async *[Symbol.asyncIterator]() {
      for (;;) {
        pulled += 1;
        yield chunk;
      }
    },
  };
  const result = await downloadAttachment('https://example.org/x', {
    ...base,
    maxBytes: 4096,
    fetchImpl: async () => ({ ok: true, status: 200, headers: { get: () => null }, body }),
  });
  assert.equal(result.saved, false);
  assert.match(result.warning, /size cap/);
  assert.equal(pulled, 5, 'the stream is abandoned one chunk past the cap');
});

test('an HTTP error is a warning, not a throw', async () => {
  const result = await downloadAttachment('https://example.org/x', {
    ...base,
    fetchImpl: async () => stubResponse(new Uint8Array(), { ok: false, status: 404 }),
  });
  assert.equal(result.saved, false);
  assert.match(result.warning, /HTTP 404/);
});

test('the GitHub token is sent to github.com and dropped on a redirect off it', async () => {
  const authorizations = [];
  const fsImpl = stubFs();
  await downloadAttachment('https://github.com/user-attachments/files/1/deck.pdf', {
    ...base,
    fsImpl,
    token: 'secret',
    fetchImpl: async (url, options) => {
      authorizations.push(options.headers.authorization ?? null);
      if (authorizations.length === 1) {
        return stubResponse(new Uint8Array(), {
          status: 302,
          headers: { location: 'https://cdn.example/b' },
        });
      }
      return stubResponse(PDF);
    },
  });
  assert.deepEqual(authorizations, ['Bearer secret', null]);
});

test('isGitHubAttachmentUrl knows the URLs GitHub’s upload control writes', () => {
  for (const url of [
    'https://github.com/user-attachments/files/12345678/deck.pdf',
    'https://github.com/user-attachments/assets/0b1c2d3e-aaaa-bbbb-cccc-1234567890ab',
    'https://github.com/example-org/catalog/files/12345678/deck.pdf',
    'https://user-images.githubusercontent.com/1/2-3.png',
    'https://private-user-images.githubusercontent.com/1/2-3.png?jwt=x',
  ]) {
    assert.equal(isGitHubAttachmentUrl(url), true, url);
  }
  for (const url of [
    'https://files.example.org/projects/1/deck.pdf',
    'https://github.com/example-org/catalog/releases/download/files/deck.pdf',
    'https://github.com/example-org/catalog/blob/main/deck.pdf',
    'https://github.com.evil.test/user-attachments/files/1/deck.pdf',
    'http://github.com/user-attachments/files/1/deck.pdf',
    'not a url',
    '',
  ]) {
    assert.equal(isGitHubAttachmentUrl(url), false, url);
  }
});

test('a file answer on some other host is kept as a link, not downloaded', () => {
  assert.equal(shouldDownload('file', 'https://github.com/user-attachments/files/1/deck.pdf'), true);
  assert.equal(shouldDownload('file', 'https://files.example.org/projects/1/deck.pdf'), false);
  // An image field has no link form: the page renders a local picture or none.
  assert.equal(shouldDownload('image', 'https://example.org/shot.png'), true);
});

test('attachmentValue keeps the link when a file could not be fetched', () => {
  const publicPath = '/catalog/brief/deck.pdf';
  const url = 'https://github.com/user-attachments/files/1/deck.pdf';
  assert.equal(attachmentValue('file', { saved: true, publicPath, url }), publicPath);
  assert.equal(
    attachmentValue('file', { saved: false, publicPath, url }),
    url,
    'not a path to a file that was never written'
  );
  // A link the page would not render is not kept; the path is, with a warning upstream.
  assert.equal(
    attachmentValue('file', {
      saved: false,
      publicPath,
      url: 'HTTPS://github.com/user-attachments/files/1/deck.pdf',
    }),
    url
  );
  assert.equal(
    attachmentValue('file', {
      saved: false,
      publicPath,
      url: "https://github.com/user-attachments/files/1/it's.pdf",
    }),
    publicPath
  );
  assert.equal(attachmentValue('image', { saved: true, publicPath, url }), publicPath);
  assert.equal(attachmentValue('image', { saved: false, publicPath, url }), '');
});
