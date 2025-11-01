/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { MapWidget } from "@/views/components/Map";
import Sidebar from "./sidebar";
import { setupKeybinds } from "@/utils/KeybindHandler";
import MapsController from "../controller";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const KB_SHORTCUTS = {
  CLOSE_SIDEBAR: "Escape",
  OPEN_SIDEBAR: "L",
  RETURN_TO_TRIP_SELECT: "BackSpace",
} as const;

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export default () => {
  const controller = MapsController.get_default();

  const map = new MapWidget({
    zoom: 12,
    style: "dark",
  });

  // Overlay a semi-transparent box on top of the map to apply a theme-based tint
  const mapContainer = Widget.Overlay({
    hexpand: true,
    vexpand: true,
    child: map,
    setup: (self) => {
      const overlay = Widget.Box({
        hexpand: true,
        vexpand: true,
        cssClasses: ["map-overlay"],
        canFocus: false,
        canTarget: false,
      });

      self.add_overlay(overlay);
    },
  });

  const sidebar = Sidebar();

  const ret = Widget.Box({
    cssClasses: ["maps"],
    children: [mapContainer, sidebar],
    setup: (self) => {
      setupKeybinds({
        name: "Map",
        widget: self,
        forwardTarget: sidebar,
        binds: {
          [KB_SHORTCUTS.OPEN_SIDEBAR]: () => {
            controller.sidebarRevealState = true;
          },
          [KB_SHORTCUTS.CLOSE_SIDEBAR]: () => {
            controller.sidebarRevealState = false;
          },
          // [KB_SHORTCUTS.RETURN_TO_TRIP_SELECT]: () => {
          //   returnToTripSelectPressed.set(!returnToTripSelectPressed.get());
          // },
        },
      });
    },
  });

  return ret;
};
