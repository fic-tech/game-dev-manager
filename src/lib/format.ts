import { formatDistanceToNowStrict, format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

export function relativeTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), {
      addSuffix: true,
      locale: ja,
    });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | undefined, fmt = "yyyy/MM/dd"): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return iso;
  }
}

export function shortDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MM/dd", { locale: ja });
  } catch {
    return iso;
  }
}

export function avatarColor(hue: number): string {
  return `hsl(${hue} 70% 55%)`;
}

export function initials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2);
}
