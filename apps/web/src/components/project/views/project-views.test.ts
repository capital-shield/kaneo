import { expect, it } from "vite-plus/test";
import {
  resolveProjectView,
  routeForView,
  tasksViewFor,
} from "./project-views";

it("serves board, list and table from the board route", () => {
  expect(routeForView("list")).toBe("board");
  expect(routeForView("table")).toBe("board");
  expect(resolveProjectView("board", "table")).toBe("table");
  expect(routeForView("gantt")).toBe("gantt");
  expect(resolveProjectView("board", "list")).toBe("list");
  expect(resolveProjectView("calendar", "list")).toBe("calendar");
});

it("returns to the last task layout, falling back to board or list", () => {
  expect(tasksViewFor("calendar", "list")).toBe("calendar");
  expect(tasksViewFor("gantt", "board")).toBe("gantt");
  expect(tasksViewFor("board", "list")).toBe("list");
  expect(tasksViewFor("table", "table")).toBe("table");
});
