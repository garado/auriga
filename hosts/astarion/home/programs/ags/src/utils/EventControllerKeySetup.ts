/* █▀▀ █░█ █▀▀ █▄░█ ▀█▀   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░ █░░ █▀▀ █▀█   █▀ █▀▀ ▀█▀ █░█ █▀█ */
/* ██▄ ▀▄▀ ██▄ █░▀█ ░█░   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄ █▄▄ ██▄ █▀▄   ▄█ ██▄ ░█░ █▄█ █▀▀ */

/* Utility function to automatically add an event controller to a widget with support
 * for forwarding events to specific widgets. */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Gdk } from "astal/gtk4";
import { log } from "@/globals.js";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

/**
 * Widget extended with event controller functionality
 */
export interface EventControlledWidget extends Gtk.Widget {
  controller: Gtk.EventControllerKey;
  _lastKey?: string; // Add this line
}

/**
 * Key binding handler function type
 */
export type KeyBindingHandler = () => void;

/**
 * Key bindings map - maps key names to their handler functions
 */
export type KeyBindings = Record<string, KeyBindingHandler>;

/**
 * Function that returns a widget to forward events to
 */
export type ForwardTargetSelector = () => Gtk.Widget | null;

/**
 * Configuration options for event controller setup
 */
export interface EventControllerConfig {
  name?: string; // Optional name for debugging
  widget: Gtk.Widget; // Widget to attach event controller to
  binds: KeyBindings; // Keybinding map

  // Another widget to forward event to, if event is unhandled
  forwardTarget?: ForwardTargetSelector | Gtk.Widget | null;
}

/*****************************************************************************
 * Function definitions
 *****************************************************************************/

/**
 * Sets up an event controller on a widget with key bindings and optional forwarding
 *
 * @param config - Configuration object for the event controller
 * @returns The configured widget with event controller attached
 *
 * @example
 * ```typescript
 * const myWidget = new Gtk.Button();
 * setupEventController({
 *   name: "MyButton",
 *   widget: myWidget,
 *   binds: {
 *     "Return": () => console.log("Enter pressed"),
 *     "Escape": () => console.log("Escape pressed")
 *   },
 *   forwardTarget: parentWidget
 * });
 * ```
 */
export function setupEventController(
  config: EventControllerConfig,
): EventControlledWidget {
  const { name, widget, binds, forwardTarget } = config;

  // Cast widget to include controller property
  const controlledWidget = widget as EventControlledWidget;

  // Create and attach event controller
  controlledWidget.controller = new Gtk.EventControllerKey();
  controlledWidget.add_controller(controlledWidget.controller);

  // Set up key press handler
  // Handler returns TRUE if key is handled; FALSE otherwise
  controlledWidget.controller.connect("key-pressed", (_, keyval) => {
    const keyName = Gdk.keyval_name(keyval);
    const controllerName = name || "Unnamed controller";

    if (!keyName) return false;

    log("eventControllerKey", `${controllerName}: ${keyName}`);

    // Check for double-key sequences (like "gg", "dd")
    const doubleKey = keyName + keyName;
    if (controlledWidget._lastKey === keyName && binds[doubleKey]) {
      binds[doubleKey]();
      controlledWidget._lastKey = undefined; // Reset after using
      return true;
    }

    // Check for single key bindings
    if (binds[keyName]) {
      binds[keyName]();
      controlledWidget._lastKey = undefined;
      return true;
    }

    // Remember this key for potential double-key sequence
    controlledWidget._lastKey = keyName;

    // Forward unhandled events if forwardTarget is specified
    if (forwardTarget !== undefined && forwardTarget !== null) {
      const targetWidget =
        typeof forwardTarget === "function" ? forwardTarget() : forwardTarget;
      if (targetWidget === null) return;
      controlledWidget.controller.forward(targetWidget);
    }

    return false;
  });

  return controlledWidget;
}
