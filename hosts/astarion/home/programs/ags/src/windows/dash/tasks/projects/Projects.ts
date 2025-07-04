/**
 * █▀█ █▀█ █▀█ ░░█ █▀▀ █▀▀ ▀█▀   █░█ █ █▀▀ █░█░█
 * █▀▀ █▀▄ █▄█ █▄█ ██▄ █▄▄ ░█░   ▀▄▀ █ ██▄ ▀▄▀▄▀
 *
 * View tasks sorted by project.
 */

import { Widget } from "astal/gtk4";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";
import Sidebar from "./sidebar/Sidebar";
import Tasklist from "./TaskList";

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
        name: "Projects",
        widget: self,
        forwardTo: sidebar,
        binds: {},
      });
    },
  });
};
