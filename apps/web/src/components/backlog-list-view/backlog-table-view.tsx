import { useMemo } from "react";
import TaskTable, { type FlatTask } from "@/components/task-table";
import type { ProjectWithTasks } from "@/types/project";

type BacklogTableViewProps = {
  project: ProjectWithTasks;
};

function BacklogTableView({ project }: BacklogTableViewProps) {
  const flatTasks = useMemo<FlatTask[]>(() => {
    const planned = (project.plannedTasks ?? []).map((task) => ({
      ...task,
      statusName: "Planned",
      statusOrder: 0,
    }));
    const archived = (project.archivedTasks ?? []).map((task) => ({
      ...task,
      statusName: "Archived",
      statusOrder: 1,
    }));
    return [...planned, ...archived];
  }, [project.plannedTasks, project.archivedTasks]);

  return <TaskTable tasks={flatTasks} projectSlug={project.slug} />;
}

export default BacklogTableView;
