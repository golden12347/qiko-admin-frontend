/** Turn API `qr_code` (SVG markup or data URI) into a value valid for `<img src>`. */
export function toQrImageSrc(qr: string): string {
  const value = qr.trim();
  if (!value) return "";

  if (value.startsWith("data:")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  if (value.startsWith("<svg") || value.startsWith("<?xml") || value.includes("<svg")) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
  }

  if (/^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 64) {
    return `data:image/png;base64,${value.replace(/\s/g, "")}`;
  }

  return value;
}
