export function imageBytes(base64: string): ArrayBuffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/=+$/, '');
  const bytes = new Uint8Array(Math.floor(clean.length * 6 / 8));
  let buffer = 0, bits = 0, offset = 0;
  for (const char of clean) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error('Could not read this image. Choose it again.');
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) { bits -= 8; bytes[offset++] = (buffer >> bits) & 255; }
  }
  return bytes.buffer;
}
