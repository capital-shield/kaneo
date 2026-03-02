import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { labelColors } from "@/constants/label-colors";
import useCreateLabel from "@/hooks/mutations/label/use-create-label";
import useDeleteLabel from "@/hooks/mutations/label/use-delete-label";
import { useUpdateTask } from "@/hooks/mutations/task/use-update-task";
import { useUpdateTaskAssignee } from "@/hooks/mutations/task/use-update-task-assignee";
import { useUpdateTaskDescription } from "@/hooks/mutations/task/use-update-task-description";
import { useUpdateTaskDueDate } from "@/hooks/mutations/task/use-update-task-due-date";
import { useUpdateTaskStatus } from "@/hooks/mutations/task/use-update-task-status";
import { useUpdateTaskPriority } from "@/hooks/mutations/task/use-update-task-status-priority";
import { useUpdateTaskTitle } from "@/hooks/mutations/task/use-update-task-title";
import useGetLabelsByTask from "@/hooks/queries/label/use-get-labels-by-task";
import useGetLabelsByWorkspace from "@/hooks/queries/label/use-get-labels-by-workspace";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { getColumnIcon } from "@/lib/column";
import { generateLink } from "@/lib/generate-link";
import { getPriorityIcon } from "@/lib/priority";
import { toast } from "@/lib/toast";
import useProjectStore from "@/store/project";
import type Task from "@/types/task";

type TaskCardContext = {
  worskpaceId: string;
  projectId: string;
};

type TaskCardContextMenuContentProps = {
  task: Task;
  taskCardContext: TaskCardContext;
  onDeleteClick: () => void;
};

export default function TaskCardContextMenuContent({
  task,
  taskCardContext,
  onDeleteClick,
}: TaskCardContextMenuContentProps) {
  const { project } = useProjectStore();
  const queryClient = useQueryClient();
  const { data: workspaceUsers } = useGetActiveWorkspaceUsers(
    taskCardContext.worskpaceId,
  );
  const { mutateAsync: updateTask } = useUpdateTask();
  const { mutateAsync: updateTaskPriority } = useUpdateTaskPriority();
  const { mutateAsync: updateTaskStatus } = useUpdateTaskStatus();
  const { mutateAsync: updateTaskAssignee } = useUpdateTaskAssignee();
  const { mutateAsync: updateTaskTitle } = useUpdateTaskTitle();
  const { mutateAsync: updateTaskDescription } = useUpdateTaskDescription();
  const { mutateAsync: updateTaskDueDate } = useUpdateTaskDueDate();
  const { mutateAsync: createLabel } = useCreateLabel();
  const { mutateAsync: deleteLabel } = useDeleteLabel();

  const { data: taskLabels = [] } = useGetLabelsByTask(task.id);
  const { data: workspaceLabels = [] } = useGetLabelsByWorkspace(
    taskCardContext.worskpaceId,
  );

  const uniqueWorkspaceLabels = useMemo(() => {
    const labelMap = new Map<string, (typeof workspaceLabels)[0]>();
    for (const label of workspaceLabels) {
      const existing = labelMap.get(label.name);
      if (!existing || (label.taskId === null && existing.taskId !== null)) {
        labelMap.set(label.name, label);
      }
    }
    return Array.from(labelMap.values());
  }, [workspaceLabels]);

  const taskLabelNames = useMemo(
    () => taskLabels.map((l) => l.name),
    [taskLabels],
  );

  const handleToggleLabel = async (labelId: string) => {
    const workspaceLabel = uniqueWorkspaceLabels.find((l) => l.id === labelId);
    if (!workspaceLabel) return;

    const isAssigned = taskLabelNames.includes(workspaceLabel.name);

    try {
      if (isAssigned) {
        const taskLabel = taskLabels.find(
          (l) => l.name === workspaceLabel.name,
        );
        if (taskLabel?.id) {
          await deleteLabel({ id: taskLabel.id });
          toast.success("Label removed");
        }
      } else {
        await createLabel({
          name: workspaceLabel.name,
          color: workspaceLabel.color,
          taskId: task.id,
          workspaceId: taskCardContext.worskpaceId,
        });
        toast.success("Label added");
      }
      await queryClient.invalidateQueries({ queryKey: ["labels", task.id] });
      await queryClient.invalidateQueries({
        queryKey: ["labels", taskCardContext.worskpaceId],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update label",
      );
    }
  };

  const usersOptions = useMemo(() => {
    return workspaceUsers?.members?.map((member) => ({
      label: member?.user?.name ?? member.userId,
      value: member.userId,
      image: member?.user?.image ?? "",
      name: member?.user?.name ?? "",
    }));
  }, [workspaceUsers]);

  const handleCopyTaskLink = () => {
    const path = `/dashboard/workspace/${taskCardContext.worskpaceId}/project/${taskCardContext.projectId}/task/${task.id}`;
    const taskLink = generateLink(path);

    navigator.clipboard.writeText(taskLink);
    toast.success("Task link copied!");
  };

  const handleChange = async (field: keyof Task, value: string | Date) => {
    try {
      switch (field) {
        case "priority":
          await updateTaskPriority({ ...task, priority: value as string });
          break;
        case "status":
          await updateTaskStatus({ ...task, status: value as string });
          break;
        case "userId":
          await updateTaskAssignee({ ...task, userId: value as string });
          break;
        case "title":
          await updateTaskTitle({ ...task, title: value as string });
          break;
        case "description":
          await updateTaskDescription({
            ...task,
            description: value as string,
          });
          break;
        default:
          await updateTask({
            ...task,
            [field]: value,
          });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update task",
      );
    } finally {
      toast.success("Task updated successfully");
    }
  };

  return (
    <ContextMenuContent className="w-46">
      <ContextMenuItem onClick={handleCopyTaskLink}>
        <span>Copy link</span>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuSub>
        <ContextMenuSubTrigger className="gap-2">
          <span>Priority</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuCheckboxItem
            key="no-priority"
            checked={task.priority === "no-priority"}
            onCheckedChange={() => handleChange("priority", "no-priority")}
            className="[&_svg]:text-muted-foreground"
          >
            {getPriorityIcon("no-priority")}
            <span>No Priority</span>
          </ContextMenuCheckboxItem>
          {["low", "medium", "high", "urgent"].map((priority) => (
            <ContextMenuCheckboxItem
              key={priority}
              checked={task.priority === priority}
              onCheckedChange={() => handleChange("priority", priority)}
              className="[&_svg]:text-muted-foreground"
            >
              {getPriorityIcon(priority)}
              <span className="capitalize">{priority}</span>
            </ContextMenuCheckboxItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <span>Status</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          {(project?.columns ?? []).map((col) => (
            <ContextMenuCheckboxItem
              key={col.id}
              checked={task.status === col.id}
              onCheckedChange={() => handleChange("status", col.id)}
              className="[&_svg]:text-muted-foreground"
            >
              {getColumnIcon(col.id, col.isFinal)}
              <span>{col.name}</span>
            </ContextMenuCheckboxItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <span>Due date</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-64 p-0">
          <div className="p-2">
            <Calendar
              mode="single"
              selected={task.dueDate ? new Date(task.dueDate) : undefined}
              onSelect={async (date) => {
                try {
                  await updateTaskDueDate({
                    ...task,
                    dueDate: date?.toISOString() || null,
                  });
                  toast.success("Task due date updated successfully");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to update task due date",
                  );
                }
              }}
              className="w-full bg-popover!"
            />
          </div>
          {task.dueDate && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="gap-2 text-muted-foreground"
                onClick={async () => {
                  try {
                    await updateTaskDueDate({
                      ...task,
                      dueDate: null,
                    });
                    toast.success("Task due date cleared");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to clear due date",
                    );
                  }
                }}
              >
                <X className="h-4 w-4" />
                <span>Clear date</span>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>

      {usersOptions && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <span>Assignee</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuCheckboxItem
              checked={!task.userId}
              onCheckedChange={() => handleChange("userId", "")}
            >
              <div
                className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center"
                title="Unassigned"
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  ?
                </span>{" "}
              </div>
              Unassigned
            </ContextMenuCheckboxItem>
            {usersOptions.map((user) => (
              <ContextMenuCheckboxItem
                key={user.value}
                checked={task.userId === user.value}
                onCheckedChange={() => handleChange("userId", user.value ?? "")}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.image ?? ""} alt={user.name || ""} />
                  <AvatarFallback className="text-xs font-medium border border-border/30">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {user.label}
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      )}

      {uniqueWorkspaceLabels.length > 0 && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <span>Label</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {uniqueWorkspaceLabels.map((label) => (
              <ContextMenuCheckboxItem
                key={label.id}
                checked={taskLabelNames.includes(label.name)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => handleToggleLabel(label.id)}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1 flex-shrink-0"
                  style={{
                    backgroundColor:
                      labelColors.find((c) => c.value === label.color)?.color ||
                      "var(--color-neutral-400)",
                  }}
                />
                <span className="truncate">{label.name}</span>
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      )}

      <ContextMenuSeparator />

      <ContextMenuItem onClick={() => handleChange("status", "archived")}>
        <span>Archive</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={() => handleChange("status", "planned")}>
        <span>Mark as planned</span>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        className="text-destructive"
        onClick={(e) => {
          e.preventDefault();
          setTimeout(() => {
            onDeleteClick();
          }, 0);
        }}
      >
        <span>Delete...</span>
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
