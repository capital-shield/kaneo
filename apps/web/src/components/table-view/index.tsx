import { useMemo } from "react";
import TaskTable, { type FlatTask } from "@/components/task-table";
import type { ProjectWithTasks } from "@/types/project";

type TableViewProps = {
  project: ProjectWithTasks;
};

function TableView({ project }: TableViewProps) {
  const flatTasks = useMemo<FlatTask[]>(
    () =>
      project.columns.flatMap((col, idx) =>
        col.tasks.map((task) => ({
          ...task,
          statusName: col.name,
          statusOrder: idx,
        })),
      ),
    [project.columns],
  );

  return <TaskTable tasks={flatTasks} projectSlug={project.slug} />;
}

export default TableView;
