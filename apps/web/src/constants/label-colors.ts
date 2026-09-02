export type LabelColor =
  | "gray"
  | "dark-gray"
  | "purple"
  | "teal"
  | "green"
  | "yellow"
  | "orange"
  | "pink"
  | "red";

export type LabelColorOption = {
  value: LabelColor;
  /** Translation key under `tasks:popover.labels.colors`. */
  key: string;
  color: string;
};

export const labelColors: LabelColorOption[] = [
  { value: "gray", key: "stone", color: "var(--color-stone-500)" },
  { value: "dark-gray", key: "slate", color: "var(--color-slate-500)" },
  { value: "purple", key: "lavender", color: "var(--color-violet-500)" },
  { value: "teal", key: "sage", color: "var(--color-emerald-600)" },
  { value: "green", key: "forest", color: "var(--color-green-600)" },
  { value: "yellow", key: "amber", color: "var(--color-amber-600)" },
  { value: "orange", key: "terracotta", color: "var(--color-orange-600)" },
  { value: "pink", key: "rose", color: "var(--color-rose-600)" },
  { value: "red", key: "crimson", color: "var(--color-red-600)" },
];
