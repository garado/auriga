/*****************************************************************************
 * Imports
 *****************************************************************************/

import Shumate from "gi://Shumate?version=1.0";
import { Widget } from "astal/gtk4";
import { GLib } from "astal";

/*****************************************************************************
 * Widget
 *****************************************************************************/

export default () => {
  const registry = Shumate.MapSourceRegistry.new_with_defaults();
  const referenceSource = registry.get_by_id(Shumate.MAP_SOURCE_OSM_MAPNIK);

  const mapView = new Shumate.SimpleMap({
    vexpand: true,
    hexpand: true,
    cssClasses: ["map"],
    showZoomButtons: false,
    mapSource: referenceSource!,
  });

  const viewport = mapView.get_viewport();

  const tileDownloader = new Shumate.TileDownloader({
    url_template:
      "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{scale}.png",
    // "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{scale}.png",
    maxZoomLevel: 19,
    minZoomLevel: 0,
  });

  const positron = new Shumate.RasterRenderer({
    id: "positron",
    name: "Positron",
    license: "CartoDB",
    dataSource: tileDownloader,
    maxZoomLevel: 19,
  });

  viewport.set_reference_map_source(referenceSource);
  mapView.set_map_source(positron);

  // Set location after a brief delay
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
    viewport.set_location(37.5485, -121.9886);
    viewport.set_zoom_level(12);
    return false;
  });

  const mapContainer = Widget.Box({
    cssClasses: ["map-container"],
    children: [mapView],
  });

  return Widget.Box({
    cssClasses: ["maps"],
    children: [mapContainer],
  });
};
