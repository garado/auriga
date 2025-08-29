/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import MapWidget from "./CustomMap";

/*****************************************************************************
 * Widget
 *****************************************************************************/

export default () => {
  const map = MapWidget({
    zoom: 10,
    style: "dark",
  });

  const mapContainer = Widget.Box({
    cssClasses: ["map-container"],
    children: [map],
  });

  return Widget.Box({
    cssClasses: ["maps"],
    children: [mapContainer],
  });
};
