import Tasks from "@/services/Tasks";
import { Widget } from "astal/gtk4";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";
import Sidebar from "./sidebar/Sidebar";
import Tasklist from "./Tasklist";

export default () => {
  const sidebar = Sidebar();
  const tasklist = Tasklist();

  return Widget.Box({
    cssClasses: ["categorized"],
    vertical: false,
    spacing: 12,
    children: [sidebar, tasklist],
    setup: (self) => {
      EventControllerKeySetup({
        name: "Categorized",
        widget: self,
        forwardTo: sidebar,
        binds: {},
      });
    },
  });
};
