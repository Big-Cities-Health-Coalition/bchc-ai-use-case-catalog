/**
 * Download the single file a submitter attached to a `file`/`image` question,
 * so the deck arrives with the submission instead of waiting for a maintainer
 * to upload it by hand.
 *
 * The rules are the ones scripts/lib/images.mjs already applies to screenshots,
 * and the host guard is literally the same function — the URL comes from an
 * issue anyone can open, and the runner sits inside a network with a metadata
 * service on it. What differs is the shape: one file, named by the schema
 * (`filename`), verified by its magic bytes against the extension the schema
 * asked for, and capped at GitHub's own upload ceiling.
 *
 * A failure is a warning, never a fatal error: the pull request still opens and
 * names what could not be fetched, exactly like a screenshot that 404s.
 */

import fs from 'node:fs';
import path from 'node:path';

import { MAX_REDIRECTS, TIMEOUT_MS, assertPublicHost, sniffImageType } from './images.mjs';
import { siteHttpUrl } from './issue_body.mjs';

/** GitHub caps an issue-form upload at 25 MB for documents. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** `%PDF`, the only signature a `.pdf` attachment may start with. */
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46];

/** Extensions that mean "this should sniff as an image", mapped to sniff output. */
const IMAGE_EXTENSIONS = new Map([
  ['.png', 'png'],
  ['.jpg', 'jpg'],
  ['.jpeg', 'jpg'],
  ['.gif', 'gif'],
  ['.webp', 'webp'],
]);

/**
 * Does the downloaded body match the extension the schema asked for?
 *
 * Extension-only trust is what turns "attach your slide deck" into "commit an
 * arbitrary blob named deck.pdf", so the bytes decide.
 *
 * @param {string} extension including the dot, lower case
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
export function matchesExtension(extension, bytes) {
  const ext = String(extension ?? '').toLowerCase();
  const body = bytes ?? new Uint8Array();
  if (ext === '.pdf') return PDF_SIGNATURE.every((byte, index) => body[index] === byte);
  const expected = IMAGE_EXTENSIONS.get(ext);
  if (!expected) return false;
  const sniffed = sniffImageType(body);
  // A .jpg that is really a PNG is still an image the site can serve, but the
  // committed name would lie about it, so the type has to agree.
  return sniffed === expected;
}

/** Extensions this module is willing to store, for an error message. */
export function acceptedExtensions() {
  return ['.pdf', ...IMAGE_EXTENSIONS.keys()];
}

/**
 * Is this a URL GitHub's own upload control wrote into the issue body?
 *
 * Those are the only answers worth fetching: the file lives on GitHub because
 * the submitter dragged it into the form. Anything else pasted into a `file`
 * question is a link to where the file is kept (a shared drive, a release
 * asset, a document too big for the 25 MB cap) and stays a link.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isGitHubAttachmentUrl(url) {
  let parsed;
  try {
    parsed = new URL(String(url ?? '').trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  if (host === 'user-images.githubusercontent.com' || host === 'private-user-images.githubusercontent.com') {
    return true;
  }
  if (host !== 'github.com') return false;
  // Current uploads, then the older per-repository form (/<owner>/<repo>/files/<id>/<name>).
  return (
    /^\/user-attachments\/(?:files|assets)\//.test(parsed.pathname) ||
    /^\/[^/]+\/[^/]+\/files\/\d+\//.test(parsed.pathname)
  );
}

/**
 * Should the scaffolder fetch this `file`/`image` answer into the entry folder?
 * A `file` answer on any host but GitHub's upload store is a link the entry
 * keeps (the page renders it as an external row); an `image` has no link form.
 *
 * @param {string} fieldType the schema field's `type`
 * @param {string} url
 * @returns {boolean}
 */
export function shouldDownload(fieldType, url) {
  return fieldType !== 'file' || isGitHubAttachmentUrl(url);
}

/**
 * The front matter value after a download attempt. A `file` that could not be
 * fetched keeps the URL it was attached at, rather than naming a path in the
 * entry folder that no file was ever written to — provided the page can render
 * that URL (`siteHttpUrl`); otherwise the path, which a maintainer fills.
 *
 * @param {string} fieldType the schema field's `type`
 * @param {{saved: boolean, publicPath: string, url: string}} outcome
 * @returns {string}
 */
export function attachmentValue(fieldType, { saved, publicPath, url }) {
  if (saved) return publicPath;
  return fieldType === 'file' ? siteHttpUrl(url) || publicPath : '';
}

/**
 * Read a body stream, aborting the moment it crosses `limit`.
 * @param {AsyncIterable<Uint8Array>} body
 * @param {number} limit
 * @param {() => void} onOverflow
 * @returns {Promise<Uint8Array>}
 */
async function readCapped(body, limit, onOverflow) {
  /** @type {Uint8Array[]} */
  const chunks = [];
  let received = 0;
  for await (const chunk of body) {
    const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
    received += bytes.byteLength;
    if (received > limit) {
      onOverflow();
      throw new Error(`it is larger than the ${Math.round(limit / (1024 * 1024))} MB size cap`);
    }
    chunks.push(bytes);
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Fetch one attachment and write it under `destDir` as `filename`.
 *
 * @param {string} url the attachment URL parsed out of the issue body
 * @param {object} options
 * @param {string} options.destDir absolute folder to write into
 * @param {string} options.filename name the schema asked for (`deck.pdf`)
 * @param {number} [options.maxBytes]
 * @param {number} [options.timeoutMs]
 * @param {string} [options.token] GitHub token, sent to github.com hosts only
 * @param {typeof fetch} [options.fetchImpl] injected for tests
 * @param {{lookup: Function}} [options.dnsImpl] injected for tests
 * @param {{mkdirSync: Function, writeFileSync: Function}} [options.fsImpl] injected for tests
 * @returns {Promise<{saved: boolean, bytes: number, warning: string}>}
 */
export async function downloadAttachment(url, options) {
  const {
    destDir,
    filename,
    maxBytes = MAX_ATTACHMENT_BYTES,
    timeoutMs = TIMEOUT_MS,
    token = '',
    fetchImpl = globalThis.fetch,
    dnsImpl = undefined,
    fsImpl = fs,
  } = options ?? {};

  const name = String(filename ?? '').trim();
  const extension = (/\.[a-z0-9]+$/i.exec(name)?.[0] ?? '').toLowerCase();
  const link = String(url ?? '').trim();
  const miss = (reason) => ({ saved: false, bytes: 0, warning: `Could not attach ${link} (${reason}).` });

  if (!extension || !acceptedExtensions().includes(extension)) {
    return miss(`\`${name}\` is not one of ${acceptedExtensions().join(', ')}`);
  }
  let parsed;
  try {
    parsed = new URL(link);
  } catch {
    return miss('it is not a URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return miss('only http(s) attachments can be downloaded');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let current = link;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      // Re-checked on every hop: a public URL that redirects to 169.254.169.254
      // is the whole reason the redirects are followed by hand.
      await (dnsImpl ? assertPublicHost(current, dnsImpl) : assertPublicHost(current));

      const headers = {};
      if (token && /(^|\.)github(usercontent)?\.com$/i.test(new URL(current).hostname)) {
        headers.authorization = `Bearer ${token}`;
      }
      const response = await fetchImpl(current, { redirect: 'manual', signal: controller.signal, headers });
      if (!response) return miss('no response');

      const status = Number(response.status);
      const location = response.headers?.get?.('location');
      if (status >= 300 && status < 400 && location) {
        const next = new URL(location, current);
        if (next.protocol !== 'http:' && next.protocol !== 'https:') {
          return miss(`it redirects to a ${next.protocol} URL`);
        }
        current = next.toString();
        continue;
      }
      if (!response.ok) return miss(`HTTP ${status}`);

      const declared = Number(response.headers?.get?.('content-length'));
      if (Number.isFinite(declared) && declared > maxBytes) {
        return miss(`it is larger than the ${Math.round(maxBytes / (1024 * 1024))} MB size cap`);
      }

      const streamed = typeof response.body?.[Symbol.asyncIterator] === 'function';
      const bytes = streamed
        ? await readCapped(response.body, maxBytes, () => controller.abort())
        : new Uint8Array(await response.arrayBuffer());
      if (bytes.length > maxBytes) {
        return miss(`it is larger than the ${Math.round(maxBytes / (1024 * 1024))} MB size cap`);
      }
      if (!matchesExtension(extension, bytes)) {
        return miss(`the file does not look like ${extension.replace('.', '').toUpperCase()}`);
      }

      fsImpl.mkdirSync(destDir, { recursive: true });
      fsImpl.writeFileSync(path.join(destDir, name), bytes);
      return { saved: true, bytes: bytes.length, warning: '' };
    }
    return miss(`it redirects more than ${MAX_REDIRECTS} times`);
  } catch (error) {
    return miss(error.message);
  } finally {
    clearTimeout(timer);
  }
}
