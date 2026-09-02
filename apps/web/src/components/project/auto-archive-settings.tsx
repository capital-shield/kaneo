import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useUpdateProject from "@/hooks/mutations/project/use-update-project";
import { useGetTasks } from "@/hooks/queries/task/use-get-tasks";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";

const OFF_VALUE = "off";
const DAY_OPTIONS = [3, 7, 14, 30] as const;

type AutoArchiveSettingsProps = {
  projectId: string;
};

export default function AutoArchiveSettings({
  projectId,
}: AutoArchiveSettingsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useGetTasks(projectId);
  const { mutateAsync: updateProject } = useUpdateProject();
  const { canManageProjects } = useWorkspacePermission();
  const canEdit = canManageProjects();

  if (isLoading || !project) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("settings:autoArchive.loading")}
      </div>
    );
  }

  const currentDays = project.autoArchiveDoneAfterDays;
  const currentValue = currentDays ? String(currentDays) : OFF_VALUE;
  const dayOptions =
    currentDays &&
    !DAY_OPTIONS.includes(currentDays as (typeof DAY_OPTIONS)[number])
      ? [...DAY_OPTIONS, currentDays].sort((a, b) => a - b)
      : [...DAY_OPTIONS];

  const handleChange = async (value: string | null) => {
    if (!value) return;

    try {
      await updateProject({
        id: project.id,
        name: project.name,
        icon: project.icon ?? "Layout",
        slug: project.slug,
        description: project.description ?? "",
        isPublic: !!project.isPublic,
        autoArchiveDoneAfterDays:
          value === OFF_VALUE ? null : Number.parseInt(value, 10),
      });

      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });

      toast.success(t("settings:autoArchive.toastUpdated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:autoArchive.toastError"),
      );
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 p-3 border border-border rounded-md bg-sidebar">
      <div className="space-y-0.5">
        <p className="text-sm">{t("settings:autoArchive.label")}</p>
        <p className="text-xs text-muted-foreground">
          {t("settings:autoArchive.hint")}
        </p>
      </div>
      <Select
        value={currentValue}
        onValueChange={(value) => {
          void handleChange(value);
        }}
      >
        <SelectTrigger className="w-48 h-8 text-sm" disabled={!canEdit}>
          <SelectValue>
            {currentDays
              ? t("settings:autoArchive.optionDays", { days: currentDays })
              : t("settings:autoArchive.optionOff")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={OFF_VALUE}>
            {t("settings:autoArchive.optionOff")}
          </SelectItem>
          {dayOptions.map((days) => (
            <SelectItem key={days} value={String(days)}>
              {t("settings:autoArchive.optionDays", { days })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
