/**
 * █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
 * ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄
 *
 * Sidebar for dashboard tasks tab, showing Taskwarrior project list
 * and sorting options.
 */

import { Widget } from "astal/gtk4";
import { ProjectListView } from "./ProjectListView";

export default () =>
  Widget.Box({
    canFocus: true,
    cssClasses: ["widget-container", "sidebar"],
    vertical: true,
    children: [ProjectListView()],
  });
