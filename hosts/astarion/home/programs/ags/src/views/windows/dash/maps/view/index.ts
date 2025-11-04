/*
 * █▀▄▀█ ▄▀█ █▀█ █▀   ▀█▀ ▄▀█ █▄▄
 * █░▀░█ █▀█ █▀▀ ▄█   ░█░ █▀█ █▄█
 *
 * Entrypoint for dashboard maps tab.
 * This tab is like Google Maps, but specifically for transit + walking/biking.
 *
 * It uses the following (all free):
 * - libshumate: builtin gtk map widget
 * - LocationIQ API: autocomplete location during search
 * - The incredible Transit API: for planning trips
 *
 * I hate American car dependency. We could have had high speed rail by now!
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";

import MapWidget from "./Map.ts";
import Sidebar from "./sidebar";
import MapsController from "../controller";
import { setupKeybinds } from "@/utils/KeybindHandler";

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
  const map = MapWidget();

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
          [KB_SHORTCUTS.RETURN_TO_TRIP_SELECT]: () => {
            controller.returnToTripSelect();
          },
        },
      });
    },
  });

  return ret;
};
