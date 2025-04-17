import Tasks, { ProjectData } from "@/services/Tasks";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";
import { bind, GObject } from "astal";
import { Widget } from "astal/gtk4";
import { ProjectListView } from "./ProjectListView";

const ts = Tasks.get_default();

const ProjectHierarchy = () => {};

export default () =>
  Widget.Box({
    canFocus: true,
    cssClasses: ["widget-container", "sidebar"],
    vertical: true,
    children: [ProjectListView()],
    // children: [Categories(), Subcategories(), SortAndFilter()],
  });
