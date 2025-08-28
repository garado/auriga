/**
 *
 *
 *
 * Monitor settings.
 *
 * Uses Gdk instead of built-in Astal libs for finer grained control.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Variable } from "astal";

import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import { MonitorArrangement } from "./MonitorArrangement";
import { PerMonitorSettings } from "./PerMonitorSettings";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  CONTAINER: "monitor",
  DRAG_SURFACE: "monitor-drag-surface",
  DRAG_BOX: "monitor-draggable",
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

/*****************************************************************************
 * Widgets
 *****************************************************************************/

export const Monitors = (globalRevealerState: Variable<boolean>) => {
  return ExpansionPanel({
    icon: "monitor-symbolic",
    label: "Monitor control",
    children: [
      new MonitorArrangement({ allowOverlap: false }),
      PerMonitorSettings(),
    ],
    cssClasses: [CSS_CLASSES.CONTAINER],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 500,
  });
};
