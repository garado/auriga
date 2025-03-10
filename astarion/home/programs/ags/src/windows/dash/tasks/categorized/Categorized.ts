import Tasks from "@/services/Tasks";
import { Widget } from "astal/gtk4";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";
import Sidebar from "./Sidebar";
import Tasklist from "./Tasklist";

export default () => {
  /**
   * Final tab assembly.
   */
  return Widget.Box({
    cssClasses: ["categorized"],
    vertical: false,
    spacing: 12,
    children: [Sidebar(), Tasklist()],
    setup: (self) => {
      EventControllerKeySetup({
        name: "Categorized",
        widget: self,
        forwardTo: null,
        binds: {},
      });
    },
  });
};
