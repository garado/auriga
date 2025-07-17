/**
 * █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
 * ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄
 *
 * Sidebar for dashboard tasks tab, showing Taskwarrior project list and (eventually) sorting options.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { ProjectListView } from "./ProjectListView";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export default () =>
  Widget.Box({
    canFocus: true,
    cssClasses: ["widget-container", "sidebar"],
    vertical: true,
    children: [ProjectListView()],
  });
