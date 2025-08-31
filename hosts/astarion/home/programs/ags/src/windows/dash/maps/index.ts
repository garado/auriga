/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import MapWidget from "./CustomMap";
import Sidebar from "./sidebar";
import Transit from "@/services/Transit";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import { sidebarContent, sidebarRevealState } from "./StateManagement";
import { ItineraryWidget } from "./sidebar/components/ItinerarySelect";

const transit = Transit.get_default();

/*****************************************************************************
 * Shortcuts
 *****************************************************************************/

const KB_SHORTCUTS = {
  CLOSE_SIDEBAR: "Escape",
  OPEN_SIDEBAR: "L",
} as const;

/*****************************************************************************
 * Widget
 *****************************************************************************/

export default () => {
  // Set up connections
  transit.connect("notify::current-trip-plan-response", () => {
    sidebarContent.children =
      transit.currentTripPlanResponse.plan.itineraries.map(ItineraryWidget);
  });

  // Set up widgets for tab
  const map = MapWidget({
    zoom: 10,
    style: "dark",
  });

  const sidebar = Sidebar();

  const mapContainer = Widget.Overlay({
    hexpand: true,
    vexpand: true,
    child: map,
    setup: (self) => {
      // Overlay a semi-transparent box on top of the map to apply a theme-based tint
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

  transit.planTrip(0, 0, 0, 0);

  return Widget.Box({
    cssClasses: ["maps"],
    children: [mapContainer, sidebar],
    setup: (self) => {
      setupEventController({
        name: "Map",
        widget: self,
        forwardTarget: sidebar,
        binds: {
          [KB_SHORTCUTS.OPEN_SIDEBAR]: () => {
            sidebarRevealState.set(true);
          },
          [KB_SHORTCUTS.CLOSE_SIDEBAR]: () => {
            sidebarRevealState.set(false);
          },
        },
      });
    },
  });
};
