import { useNavigate } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CalendarClock,
  CalendarX,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { labelColors } from "@/constants/label-colors";
import { useDeleteTask } from "@/hooks/mutations/task/use-delete-task";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { dueDateStatusColors, getDueDateStatus } from "@/lib/due-date-status";
import { getPriorityIcon } from "@/lib/priority";
import { toast } from "@/lib/toast";
import queryClient from "@/query-client";
import useProjectStore from "@/store/project";
import { useUserPreferencesStore } from "@/store/user-preferences";
import type Task from "@/types/task";
import TaskCardContextMenuContent from "../kanban-board/task-card-context-menu/task-card-context-menu-content";

export type FlatTask = Task & { statusName: string; statusOrder: number };

type TaskTableProps = {
  tasks: FlatTask[];
  projectSlug: string;
};

function TaskTable({ tasks, projectSlug }: TaskTableProps) {
  const navigate = useNavigate();
  const { project: storeProject } = useProjectStore();
  const { data: workspace } = useActiveWorkspace();
  const {
    showAssignees,
    showPriority,
    showDueDates,
    showLabels,
    showTaskNumbers,
  } = useUserPreferencesStore();
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const { mutateAsync: deleteTask } = useDeleteTask();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "statusOrder", desc: false },
  ]);

  const columns = useMemo<ColumnDef<FlatTask>[]>(() => {
    const cols: ColumnDef<FlatTask>[] = [];

    if (showPriority) {
      cols.push({
        id: "priority",
        header: ({ column }) => (
          <SortableHeader
            label=""
            column={column}
            className="w-10 text-center"
          />
        ),
        accessorFn: (row) => {
          const order: Record<string, number> = {
            urgent: 0,
            high: 1,
            medium: 2,
            low: 3,
          };
          return order[row.priority ?? ""] ?? 4;
        },
        cell: ({ row }) => (
          <td className="w-10 px-2 text-center">
            <span className="inline-flex items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5">
              {getPriorityIcon(row.original.priority ?? "")}
            </span>
          </td>
        ),
        size: 40,
        enableHiding: false,
      });
    }

    if (showTaskNumbers) {
      cols.push({
        id: "number",
        header: ({ column }) => (
          <SortableHeader label="#" column={column} className="w-16" />
        ),
        accessorFn: (row) => row.number,
        cell: ({ row }) => (
          <td className="w-16 px-2 font-mono text-xs text-muted-foreground">
            {projectSlug}-{row.original.number}
          </td>
        ),
        size: 72,
      });
    }

    cols.push({
      id: "title",
      header: ({ column }) => (
        <SortableHeader label="Title" column={column} className="min-w-60" />
      ),
      accessorFn: (row) => row.title,
      cell: ({ row }) => (
        <td className="min-w-60 flex-1 px-2 text-sm text-foreground truncate">
          {row.original.title}
        </td>
      ),
      enableHiding: false,
    });

    // Hidden column used only for default sort — keeps rows in their natural section order
    cols.push({
      id: "statusOrder",
      accessorFn: (row) => row.statusOrder,
      header: () => null,
      cell: () => null,
      enableHiding: true,
    });

    cols.push({
      id: "statusName",
      header: ({ column }) => (
        <SortableHeader label="Status" column={column} className="w-28" />
      ),
      accessorFn: (row) => row.statusOrder,
      cell: ({ row }) => (
        <td className="w-28 px-2 text-xs text-muted-foreground">
          {row.original.statusName}
        </td>
      ),
      size: 120,
    });

    if (showLabels) {
      cols.push({
        id: "labels",
        header: ({ column }) => (
          <SortableHeader label="Labels" column={column} className="w-40" />
        ),
        accessorFn: (row) => row.labels[0]?.name ?? "",
        cell: ({ row }) => (
          <td className="w-40 px-2">
            <div className="flex flex-wrap gap-1">
              {row.original.labels.map(
                (label: { id: string; name: string; color: string }) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] flex items-center"
                    style={{
                      borderColor:
                        labelColors.find((c) => c.value === label.color)
                          ?.color || "var(--color-neutral-400)",
                    }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 mr-1 rounded-full"
                      style={{
                        backgroundColor:
                          labelColors.find((c) => c.value === label.color)
                            ?.color || "var(--color-neutral-400)",
                      }}
                    />
                    <span className="truncate max-w-[120px]">{label.name}</span>
                  </Badge>
                ),
              )}
            </div>
          </td>
        ),
        size: 160,
      });
    }

    if (showDueDates) {
      cols.push({
        id: "dueDate",
        header: ({ column }) => (
          <SortableHeader label="Due date" column={column} className="w-28" />
        ),
        accessorFn: (row) =>
          row.dueDate
            ? new Date(row.dueDate).getTime()
            : Number.POSITIVE_INFINITY,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          if (!dueDate) return <td className="w-28 px-2" />;
          const status = getDueDateStatus(dueDate);
          return (
            <td className="w-28 px-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${dueDateStatusColors[status]}`}
              >
                {status === "overdue" && <CalendarX className="w-3 h-3" />}
                {status === "due-soon" && <CalendarClock className="w-3 h-3" />}
                {(status === "far-future" || status === "no-due-date") && (
                  <Calendar className="w-3 h-3" />
                )}
                {format(new Date(dueDate), "MMM d")}
              </span>
            </td>
          );
        },
        size: 120,
      });
    }

    if (showAssignees) {
      cols.push({
        id: "assigneeName",
        header: ({ column }) => (
          <SortableHeader label="Assignee" column={column} className="w-24" />
        ),
        accessorFn: (row) => row.assigneeName ?? "",
        cell: ({ row }) => {
          const task = row.original;
          return (
            <td className="w-24 px-2">
              {task.userId ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={task.assigneeImage ?? ""}
                    alt={task.assigneeName ?? ""}
                  />
                  <AvatarFallback className="text-xs font-medium border border-border/30">
                    {task.assigneeName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center"
                  title="Unassigned"
                >
                  <span className="text-[10px] font-medium text-muted-foreground">
                    ?
                  </span>
                </div>
              )}
            </td>
          );
        },
        size: 100,
      });
    }

    return cols;
  }, [
    showPriority,
    showTaskNumbers,
    showLabels,
    showDueDates,
    showAssignees,
    projectSlug,
  ]);

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleRowClick = (task: FlatTask, e: React.MouseEvent) => {
    if (e.defaultPrevented) return;
    const currentParams = new URLSearchParams(window.location.search);
    const currentTaskId = currentParams.get("taskId");
    if (currentTaskId === task.id) {
      navigate({ to: ".", search: {} });
    } else {
      navigate({ to: ".", search: { taskId: task.id } });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      queryClient.invalidateQueries({
        queryKey: ["tasks", storeProject?.id],
      });
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task",
      );
    } finally {
      setDeleteTaskId(null);
    }
  };

  const taskToDelete = deleteTaskId
    ? tasks.find((t) => t.id === deleteTaskId)
    : null;

  return (
    <div className="w-full h-full overflow-auto bg-muted/20">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-border bg-background sticky top-0 z-10"
            >
              {headerGroup.headers
                .filter((h) => h.column.id !== "statusOrder")
                .map((header) => (
                  <th
                    key={header.id}
                    className="px-2 py-2 text-left text-xs font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <ContextMenu key={row.id}>
              <ContextMenuTrigger asChild>
                <tr
                  className="border-b border-border/50 hover:bg-accent/30 cursor-pointer h-10 transition-colors"
                  onClick={(e) => handleRowClick(row.original, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleRowClick(
                        row.original,
                        e as unknown as React.MouseEvent,
                      );
                  }}
                >
                  {row
                    .getVisibleCells()
                    .filter((cell) => cell.column.id !== "statusOrder")
                    .map((cell) =>
                      flexRender(cell.column.columnDef.cell, cell.getContext()),
                    )}
                </tr>
              </ContextMenuTrigger>

              {storeProject && workspace && (
                <TaskCardContextMenuContent
                  task={row.original}
                  taskCardContext={{
                    projectId: storeProject.id,
                    worskpaceId: workspace.id,
                  }}
                  onDeleteClick={() => setDeleteTaskId(row.original.id)}
                />
              )}
            </ContextMenu>
          ))}
        </tbody>
      </table>

      {taskToDelete && (
        <AlertDialog
          open={!!deleteTaskId}
          onOpenChange={(open) => {
            if (!open) setDeleteTaskId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the task and all its data. You
                can't undo this action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose>Cancel</AlertDialogClose>
              <AlertDialogClose
                onClick={() => handleDeleteTask(taskToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Task
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

type SortableHeaderProps = {
  label: string;
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
  className?: string;
};

function SortableHeader({ label, column, className }: SortableHeaderProps) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${className ?? ""}`}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : label ? (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      ) : null}
    </button>
  );
}

export default TaskTable;
