/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import MapWidget from "./CustomMap";
import Sidebar from "./Sidebar";

/*****************************************************************************
 * Widget
 *****************************************************************************/

export default () => {
  const map = MapWidget({
    zoom: 10,
    style: "dark",
  });

  return Widget.Overlay({
    cssClasses: ["maps"],
    canTarget: true,
    hexpand: true,
    child: map,
    setup: (self) => {
      self.add_overlay(Sidebar());
    },
  });
};
