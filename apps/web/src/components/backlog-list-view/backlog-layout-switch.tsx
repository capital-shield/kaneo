import { Rows3, Table2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { useUserPreferencesStore } from "@/store/user-preferences";

const BACKLOG_LAYOUTS = [
  { id: "list", labelKey: "tasks:view.list", icon: Rows3 },
  { id: "table", labelKey: "tasks:view.table", icon: Table2 },
] as const;

export function BacklogLayoutSwitch() {
  const { t } = useTranslation();
  const backlogViewMode = useUserPreferencesStore(
    (state) => state.backlogViewMode,
  );
  const setBacklogViewMode = useUserPreferencesStore(
    (state) => state.setBacklogViewMode,
  );

  return (
    <div
      role="group"
      aria-label={t("tasks:display.layout")}
      className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-background p-1 dark:bg-input/32"
    >
      {BACKLOG_LAYOUTS.map((layout) => {
        const Icon = layout.icon;
        const active = layout.id === backlogViewMode;
        return (
          <button
            key={layout.id}
            type="button"
            aria-pressed={active}
            onClick={() => setBacklogViewMode(layout.id)}
            className={cn(
              "flex h-13 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {t(layout.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
