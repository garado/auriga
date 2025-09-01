/**
 * █▀▄▀█ ▄▀█ █▀█ █▀
 * █░▀░█ █▀█ █▀▀ ▄█
 *
 * Navigation widget. Made because it was fun.
 *
 * Made with the following (all entirely free)
 * - libshumate (gtk map widget)
 * - transit API (routing)
 * - locationIQ API (location autocomplete)
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";

import { setupEventController } from "@/utils/EventControllerKeySetup";
import MapWidget from "./CustomMap";
import Sidebar from "./sidebar";
import { TripResult } from "./sidebar/components/TripResultOption";
import { TripResultDetails } from "./sidebar/components/TripResultDetails";
import Transit, { Stop } from "@/services/Transit";
import {
  tripPlan,
  sidebarContent,
  sidebarRevealState,
  previewedItinerary,
  selectedItinerary,
  previewedLocation,
  returnToTripSelectPressed,
} from "./StateManagement";

/*****************************************************************************
 * Shortcuts
 *****************************************************************************/

const KB_SHORTCUTS = {
  CLOSE_SIDEBAR: "Escape",
  OPEN_SIDEBAR: "L",
  RETURN_TO_TRIP_SELECT: "BackSpace",
} as const;

/*****************************************************************************
 * Widget
 *****************************************************************************/

/** For testing and development purposes */
export const debug = async () => {
  const transit = Transit.get_default();
  const _tripPlan = await transit.planTrip(0, 0, 0, 0);
  tripPlan.set(_tripPlan);
};

export default () => {
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
          [KB_SHORTCUTS.RETURN_TO_TRIP_SELECT]: () => {
            returnToTripSelectPressed.set(!returnToTripSelectPressed.get());
          },
        },
      });
    },
  });

  const showTripPlan = () => {
    const plan = tripPlan.get()?.plan;
    if (plan === undefined) return;

    map.clearRoutes();
    map.clearMarkers();

    sidebarContent.children = plan.itineraries.map(TripResult);

    const coords = [
      { lat: plan.from.lat, lon: plan.from.lon },
      { lat: plan.to.lat, lon: plan.to.lon },
    ];

    map.centerOnRoute(coords);

    map.addMarker(coords[0].lat, coords[0].lon, "map-pin-symbolic");
    map.addMarker(coords[1].lat, coords[1].lon, "map-pin-symbolic");

    previewedItinerary.set(plan.itineraries[0]);
  };

  tripPlan.subscribe(() => {
    showTripPlan();
  });

  // Show itinerary preview on map when user hovers over different itinerary options
  previewedItinerary.subscribe((itinerary) => {
    if (itinerary === undefined) return;

    map.clearRoutes();

    for (let index = 0; index < itinerary.legs.length; index++) {
      const leg = itinerary.legs[index];
      const color = leg.routeColor ? `#${leg.routeColor}` : undefined;

      // Starting point of leg
      const coordinates = [{ lat: leg.from.lat, lon: leg.from.lon }];

      // Intermediate stops, if any
      if ("intermediateStops" in leg) {
        const intermediateCoords = (leg.intermediateStops as Stop[]).flatMap(
          (stop) => [{ lat: stop.lat, lon: stop.lon }],
        );
        coordinates.push(...intermediateCoords);
      }

      // Ending point of leg
      coordinates.push({ lat: leg.to.lat, lon: leg.to.lon });

      map.addRoute(coordinates, color);
    }
  });

  // When itinerary is selected, show detailed itinerary
  selectedItinerary.subscribe((itinerary) => {
    if (itinerary === undefined) return;
    sidebarContent.children = [TripResultDetails(itinerary)];

    // Focus map on starting point of trip
    const startPoint = selectedItinerary.get()!.legs[0].from;
    map.animateTo(startPoint.lat, startPoint.lon, 15.5);
  });

  // When place prediction is focused, map should zoom there and show a marker
  previewedLocation.subscribe((location) => {
    if (location === undefined) return;
    map.clearMarkers();
    map.animateTo(Number(location.lat), Number(location.lon), 13);
    map.addMarker(
      Number(location.lat),
      Number(location.lon),
      "map-pin-symbolic",
    );
  });

  returnToTripSelectPressed.subscribe(() => {
    showTripPlan();
    selectedItinerary.set(undefined);
  });

  debug();

  return ret;
};
