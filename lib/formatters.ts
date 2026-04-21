export function formatAmount(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(2)}億`;
  if (abs >= 1e4) return `${sign}${Math.round(abs / 1e4).toLocaleString()}萬`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

export function formatFullAmount(value: number): string {
  return Math.round(value).toLocaleString();
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}
