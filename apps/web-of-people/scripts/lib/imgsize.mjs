// Reads pixel dimensions from JPEG or PNG bytes, so recorded sizes come from the file itself.
export function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  throw new Error('unrecognised image');
}

export function scaledNote(orig, actual) {
  return orig.width === actual.width && orig.height === actual.height
    ? `Original file as served by Commons (${actual.width}×${actual.height} px); no scaling or other edits.`
    : `Scaled from ${orig.width}×${orig.height} to ${actual.width}×${actual.height} px by the Commons thumbnailer; no other edits.`;
}
