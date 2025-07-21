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

import { astalify, Gdk, Gtk } from "astal/gtk4";
import { Variable } from "astal";

import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import { MonitorArrangement } from "./MonitorArrangement";

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

const GtkFixed = astalify(Gtk.Fixed);
const monitors = Gdk.DisplayManager.get().get_default_display()?.get_monitors();

/*****************************************************************************
 * Widgets
 *****************************************************************************/

const Arrangement = () => {
  const surface = GtkFixed({});

  const arrangment = new MonitorArrangement(surface, true);

  if (!monitors) return arrangment;

  for (let i = 0; i < monitors?.get_n_items(); i++) {
    const monitor = monitors?.get_item(i);
    arrangment.addMonitor(monitor);
  }

  return arrangment;
};

export const Monitors = (globalRevealerState: Variable<boolean>) => {
  return ExpansionPanel({
    icon: "monitor-symbolic",
    label: "Monitor control",
    children: [Arrangement()],
    cssClasses: [CSS_CLASSES.CONTAINER],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 500,
  });
};
