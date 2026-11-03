export const REPORT_IMAGE_LIMIT = 5 * 1024 * 1024;
export function canAccessReport(owner: string, registration: string | null, admin: boolean): boolean {
  return admin || (!!registration && owner === registration);
}
export function imageExtension(bytes: Uint8Array): string | null {
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) return "png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}