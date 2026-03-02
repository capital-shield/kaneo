import { Badge } from "@/components/ui/badge";
import useGetLabelsByTask from "@/hooks/queries/label/use-get-labels-by-task";

function TaskCardLabels({ taskId }: { taskId: string }) {
  const { data: labels = [] } = useGetLabelsByTask(taskId);

  if (!labels.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label: { id: string; name: string; color: string }) => (
        <Badge
          key={label.id}
          color={label.color}
          variant="outline"
          className="px-2 py-0.5 text-[10px] flex items-center"
        >
          <span
            className="inline-block w-1.5 h-1.5 mr-1 rounded-full"
            style={{
              backgroundColor:
                labelColors.find((c) => c.value === label.color)?.color ||
                "var(--color-neutral-400)",
            }}
          />
          <span className="truncate max-w-[80px]">{label.name}</span>
        </Badge>
      ))}
    </div>
  );
}

export default TaskCardLabels;
