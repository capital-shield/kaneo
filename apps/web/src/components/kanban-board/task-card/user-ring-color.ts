const USER_RING_COLORS = [
  "ring-rose-400",
  "ring-amber-400",
  "ring-emerald-400",
  "ring-sky-400",
  "ring-violet-400",
  "ring-fuchsia-400",
  "ring-teal-400",
  "ring-orange-400",
] as const;

export function getUserRingColor(userId: string | null | undefined) {
  if (!userId) return "ring-border";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return USER_RING_COLORS[Math.abs(hash) % USER_RING_COLORS.length];
}
