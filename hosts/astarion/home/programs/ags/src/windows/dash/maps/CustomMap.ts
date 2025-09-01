/**
 * █▀▄▀█ ▄▀█ █▀█
 * █░▀░█ █▀█ █▀▀
 *
 * Custom map widget made with libshumate.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Gtk from "gi://Gtk?version=4.0";
import Shumate from "gi://Shumate?version=1.0";
import { GLib, GObject } from "astal";
import { Gdk } from "astal/gtk4";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const DEFAULT_LATITUDE = 37.7749;
const DEFAULT_LONGITUDE = -122.4194;

/*****************************************************************************
 * Types
 *****************************************************************************/

type MapStyle = "dark" | "light" | "osm";

interface MapWidgetProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  style?: MapStyle;
  showZoomButtons?: boolean;
}

/*****************************************************************************
 * Map styles
 *****************************************************************************/

const MAP_STYLES: Record<MapStyle, string | null> = {
  dark: "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{scale}.png",
  light:
    "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{scale}.png",
  osm: null,
};

/*****************************************************************************
 * Class
 *****************************************************************************/

export const MapWidget = GObject.registerClass(
  {
    GTypeName: "MapWidget",
    Properties: {
      latitude: GObject.ParamSpec.double(
        "latitude",
        "Latitude",
        "Map latitude",
        GObject.ParamFlags.READWRITE,
        -90.0,
        90.0,
        DEFAULT_LATITUDE,
      ),
      longitude: GObject.ParamSpec.double(
        "longitude",
        "Longitude",
        "Map longitude",
        GObject.ParamFlags.READWRITE,
        -180.0,
        180.0,
        DEFAULT_LONGITUDE,
      ),
      zoom: GObject.ParamSpec.int(
        "zoom",
        "Zoom",
        "Map zoom level",
        GObject.ParamFlags.READWRITE,
        0,
        20,
        12,
      ),
      style: GObject.ParamSpec.string(
        "style",
        "Style",
        "Map style",
        GObject.ParamFlags.READWRITE,
        "dark",
      ),
    },
  },
  class extends Gtk.Box {
    private registry: Shumate.MapSourceRegistry;
    private referenceSource: Shumate.MapSource;
    private mapView: Shumate.SimpleMap;
    private viewport: Shumate.Viewport;
    private pathLayers: Shumate.PathLayer[] = [];
    private _latitude: number = DEFAULT_LATITUDE;
    private _longitude: number = DEFAULT_LONGITUDE;
    private _zoom: number = 12;
    private _style: MapStyle;

    constructor(props: MapWidgetProps = {}) {
      super(props as any);

      this.registry = Shumate.MapSourceRegistry.new_with_defaults();

      this.referenceSource = this.registry.get_by_id(
        Shumate.MAP_SOURCE_OSM_MAPNIK,
      )!;

      this.mapView = new Shumate.SimpleMap({
        vexpand: true,
        hexpand: true,
        cssClasses: ["map"],
        showZoomButtons: props.showZoomButtons ?? false,
        mapSource: this.referenceSource,
      });

      this.viewport = this.mapView.get_viewport();
      this.viewport.set_reference_map_source(this.referenceSource);

      this.append(this.mapView);

      if (props.latitude !== undefined) this.latitude = props.latitude;
      if (props.longitude !== undefined) this.longitude = props.longitude;
      if (props.zoom !== undefined) this.zoom = props.zoom;

      this._style = props.style ?? "dark";

      if (props.style !== undefined && props.style !== "osm") {
        this.updateStyle();
      }

      this.updateLocation();
    }

    get latitude(): number {
      return this._latitude;
    }

    set latitude(value: number) {
      if (this._latitude !== value) {
        this._latitude = value;
        this.notify("latitude");
        this.updateLocation();
      }
    }

    get longitude(): number {
      return this._longitude;
    }

    set longitude(value: number) {
      if (this._longitude !== value) {
        this._longitude = value;
        this.notify("longitude");
        this.updateLocation();
      }
    }

    get zoom(): number {
      return this._zoom;
    }

    set zoom(value: number) {
      if (this._zoom !== value) {
        this._zoom = value;
        this.notify("zoom");
        this.updateLocation();
      }
    }

    get style(): MapStyle {
      return this._style;
    }

    set style(value: MapStyle) {
      if (this._style !== value) {
        this._style = value;
        this.notify("style");
        this.updateStyle();
      }
    }

    private updateStyle(): void {
      if (this.mapView === undefined) return;

      if (this._style === "osm") {
        this.mapView.set_map_source(this.referenceSource);
        return;
      }

      const url = MAP_STYLES[this._style];
      if (!url) return;

      const tileDownloader = new Shumate.TileDownloader({
        urlTemplate: url,
        minZoomLevel: 0,
      });

      const renderer = new Shumate.RasterRenderer({
        id: "positron",
        name: "Positron",
        license: "CartoDB",
        dataSource: tileDownloader,
        maxZoomLevel: 16,
      });

      this.mapView.set_map_source(renderer);
    }

    private updateLocation(): void {
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
        this.viewport.set_location(this._latitude, this._longitude);
        this.viewport.set_zoom_level(this._zoom);
        return false;
      });
    }

    setLocation(latitude: number, longitude: number, zoom?: number): void {
      this.latitude = latitude;
      this.longitude = longitude;
      if (zoom !== undefined) this.zoom = zoom;
    }

    getViewport(): Shumate.Viewport {
      return this.viewport;
    }

    centerOnRoute(coordinates: Array<{ lat: number; lon: number }>): void {
      if (coordinates.length === 0) return;

      let minLat = coordinates[0].lat;
      let maxLat = coordinates[0].lat;
      let minLon = coordinates[0].lon;
      let maxLon = coordinates[0].lon;

      coordinates.forEach((coord) => {
        minLat = Math.min(minLat, coord.lat);
        maxLat = Math.max(maxLat, coord.lat);
        minLon = Math.min(minLon, coord.lon);
        maxLon = Math.max(maxLon, coord.lon);
      });

      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;

      const latDiff = maxLat - minLat;
      const lonDiff = maxLon - minLon;
      const maxDiff = Math.max(latDiff, lonDiff);

      let zoom = 18;
      if (maxDiff > 0.01) zoom = 15;
      if (maxDiff > 0.05) zoom = 13;
      if (maxDiff > 0.1) zoom = 11;
      if (maxDiff > 0.5) zoom = 9;
      if (maxDiff > 1.0) zoom = 7;
      if (maxDiff > 5.0) zoom = 5;

      this.animateTo(centerLat, centerLon, zoom, 1000);
    }

    animateTo(
      latitude: number,
      longitude: number,
      zoom?: number,
      duration: number = 1000,
    ): void {
      const startLat = this._latitude;
      const startLng = this._longitude;
      const startZoom = this._zoom;
      const targetZoom = zoom ?? this._zoom;

      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);

        // Interpolate values
        const currentLat = startLat + (latitude - startLat) * eased;
        const currentLng = startLng + (longitude - startLng) * eased;
        const currentZoom = startZoom + (targetZoom - startZoom) * eased;

        // Update without triggering the timeout in updateLocation
        this._latitude = currentLat;
        this._longitude = currentLng;
        this._zoom = currentZoom;

        this.viewport.set_location(currentLat, currentLng);
        this.viewport.set_zoom_level(currentZoom);

        if (progress < 1) {
          GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
            animate();
            return false;
          });
        }
      };

      animate();
    }

    addRoute(
      coordinates: Array<{ lat: number; lon: number }>,
      color: string = "#ffffff",
    ): void {
      const pathLayer = new Shumate.PathLayer({
        viewport: this.viewport,
      });

      coordinates.forEach((coord) => {
        const location = new Shumate.Coordinate({
          latitude: coord.lat,
          longitude: coord.lon,
        });

        pathLayer.add_node(location);
      });

      // Set path styling
      const rgba = new Gdk.RGBA();
      rgba.parse(color);

      pathLayer.set_stroke_color(rgba);
      pathLayer.set_stroke_width(4.0);

      this.mapView.add_overlay_layer(pathLayer);
      this.pathLayers.push(pathLayer);
    }

    // Clear all routes
    clearRoutes(): void {
      for (let index = 0; index < this.pathLayers.length; index++) {
        const layer = this.pathLayers[index];
        layer.remove_all();
        this.mapView.remove_overlay_layer(layer);
      }
      this.pathLayers = [];
    }
  },
);

/*****************************************************************************
 * Factory function
 *****************************************************************************/

export default (props: MapWidgetProps = {}) => {
  return new MapWidget(props);
};
