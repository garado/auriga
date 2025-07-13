/**
 * █▀█ █▀█ █▀█ ░░█ █▀▀ █▀▀ ▀█▀   █░█ █ █▀▀ █░█░█
 * █▀▀ █▀▄ █▄█ █▄█ ██▄ █▄▄ ░█░   ▀▄▀ █ ██▄ ▀▄▀▄▀
 *
 * View tasks sorted by project.
 *
 * Includes:
 * - Sidebar to navigate through all projects
 * - List of tasks for the currently selected projects
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import Sidebar from "./sidebar/Sidebar";
import Tasklist from "./TaskList";

/*****************************************************************************
 * Composition
 *****************************************************************************/

export default () => {
  const sidebar = Sidebar();
  const tasklist = Tasklist();

  return Widget.Box({
    cssClasses: ["categorized"],
    vertical: false,
    spacing: 12,
    children: [sidebar, tasklist],
    setup: (self) => {
      setupEventController({
        name: "Projects",
        widget: self,
        forwardTarget: sidebar,
        binds: {},
      });
    },
  });
};
