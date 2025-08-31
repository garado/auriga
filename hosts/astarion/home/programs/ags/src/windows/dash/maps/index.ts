/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import MapWidget from "./CustomMap";
import Sidebar from "./sidebar";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import {
  tripPlanUpdated,
  sidebarContent,
  sidebarRevealState,
  previewedItinerary,
  selectedItinerary,
} from "./StateManagement";
import { TripResult } from "./sidebar/components/TripResultOption";
import { TripResultDetails } from "./sidebar/components/TripResultDetails";
import Transit from "@/services/Transit";

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

// For development purposes
export const debug = async () => {
  const transit = Transit.get_default();
  const tripPlan = await transit.planTrip(0, 0, 0, 0);
  tripPlanUpdated.set(tripPlan);
};

export default () => {
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

  const ret = Widget.Box({
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

  // Set up connections
  tripPlanUpdated.subscribe(() => {
    const plan = tripPlanUpdated.get()?.plan;
    if (plan === undefined) return;

    map.clearRoutes();

    sidebarContent.children = plan.itineraries.map(TripResult);
    sidebarContent.queue_resize();

    map.centerOnRoute([
      { lat: plan.from.lat, lon: plan.from.lon },
      { lat: plan.to.lat, lon: plan.to.lon },
    ]);

    previewedItinerary.set(plan.itineraries[0]);
  });

  previewedItinerary.subscribe((itinerary) => {
    if (itinerary === undefined) return;

    map.clearRoutes();

    for (let index = 0; index < itinerary.legs.length; index++) {
      const leg = itinerary.legs[index];

      const coordinates = [
        { lat: leg.from.lat, lon: leg.from.lon },
        { lat: leg.to.lat, lon: leg.to.lon },
      ];

      const color = leg.routeColor ? `#${leg.routeColor}` : undefined;
      map.addRoute(coordinates, color);
    }
  });

  selectedItinerary.subscribe((itinerary) => {
    if (itinerary === undefined) return;
    sidebarContent.children = [TripResultDetails(itinerary)];
    sidebarContent.queue_resize();

    const startPoint = selectedItinerary.get()!.legs[0].from;
    map.animateTo(startPoint.lat, startPoint.lon, 15.5); // TODO dynamically calculate zoom value
  });

  debug();

  return ret;
};
