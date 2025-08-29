/*****************************************************************************
 * Imports
 *****************************************************************************/

import Shumate from "gi://Shumate?version=1.0";
import { GLib, GObject } from "astal";
import Gtk from "gi://Gtk?version=4.0";

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
      if (this._style === "osm") {
        this.mapView.set_map_source(this.referenceSource);
        return;
      }

      const url = MAP_STYLES[this._style];
      if (!url) return;

      const tileDownloader = new Shumate.TileDownloader({
        urlTemplate: url,
        maxZoomLevel: 12,
        minZoomLevel: 0,
      });

      const renderer = new Shumate.RasterRenderer({
        // id: this._style,
        // name: this._style.charAt(0).toUpperCase() + this._style.slice(1),
        id: "positron",
        name: "Positron",
        license: "CartoDB",
        dataSource: tileDownloader,
        maxZoomLevel: 19,
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
  },
);

/*****************************************************************************
 * Factory function
 *****************************************************************************/

export default (props: MapWidgetProps = {}) => {
  return new MapWidget(props);
};
