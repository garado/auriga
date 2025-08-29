/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import MapWidget from "./CustomMap";
import Sidebar from "./Sidebar";
import { setupEventController } from "@/utils/EventControllerKeySetup";

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
  const map = MapWidget({
    zoom: 10,
    style: "dark",
  });

  const sidebar = Sidebar();

  const route231Coordinates = [
    { lat: 37.557355, lng: -121.97663 }, // Fremont BART
    { lat: 37.54847, lng: -121.988891 }, // Walnut Ave & Fremont Blvd
    { lat: 37.534563, lng: -121.995827 }, // Fremont Blvd & Auto Mall Pkwy
    { lat: 37.487644, lng: -121.916904 }, // Auto Mall Pkwy & Osgood Rd
    { lat: 37.486753, lng: -121.913607 }, // Warm Springs/South Fremont BART
    { lat: 37.432741, lng: -121.890221 }, // Warm Springs Blvd & Dixon Landing
    { lat: 37.410178, lng: -121.890542 }, // Milpitas Blvd & Great Mall Pkwy
    { lat: 37.409467, lng: -121.890859 }, // Milpitas BART
  ];

  map.addRoute(route231Coordinates, "#D282BE"); // Purple route color

  return Widget.Box({
    cssClasses: ["maps"],
    hexpand: true,
    vexpand: true,
    children: [map, sidebar],
    setup: (self) => {
      setupEventController({
        name: "Map",
        widget: self,
        forwardTarget: sidebar,
        binds: {
          [KB_SHORTCUTS.OPEN_SIDEBAR]: () => {
            sidebar.revealer.set(true);
          },
          [KB_SHORTCUTS.CLOSE_SIDEBAR]: () => {
            sidebar.revealer.set(false);
          },
        },
      });
    },
  });
};
