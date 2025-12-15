/**
 * █▀▄▀█ ▄▀█ █▀█
 * █░▀░█ █▀█ █▀▀
 *
 * Custom map widget made with libshumate.
 * This is a base map widget that can be extended for any use case
 * For the Auriga-specific map widget used in the dashboard, see: `src/views/windows/dash/maps/view/Map.ts`
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Gtk from "gi://Gtk?version=4.0";
import Shumate from "gi://Shumate?version=1.0";
import { GLib, GObject } from "astal";
import { Gdk, Widget } from "astal/gtk4";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const DEFAULT_LATITUDE = 37.7749;
const DEFAULT_LONGITUDE = -122.4194;

const DEFAULT_ZOOM_LEVEL = 12;
const MAX_ZOOM_LEVEL = 20;

const DEFAULT_ANIMATION_TIME_MS = 1000;

/*****************************************************************************
 * Types
 *****************************************************************************/

type MapStyle = "dark" | "light" | "osm";

interface MapWidgetProps {
  latitude?: number; // Starting latitude
  longitude?: number; // Starting longitude
  zoom?: number; // Starting zoom
  style?: MapStyle;
  showZoomButtons?: boolean;
}

/*****************************************************************************
 * Map styles
 *****************************************************************************/

const MAP_STYLES: Record<MapStyle, string | null> = {
  dark: "http://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{scale}.png",
  light:
    "http://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{scale}.png",
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
    /*****************************************************************************
     * Private variables
     *****************************************************************************/

    private registry: Shumate.MapSourceRegistry;
    private referenceSource: Shumate.MapSource;
    private mapView: Shumate.SimpleMap;
    private viewport: Shumate.Viewport;
    private pathLayers: Shumate.PathLayer[] = [];
    private markerLayers: Shumate.MarkerLayer[] = [];
    private _latitude: number = DEFAULT_LATITUDE;
    private _longitude: number = DEFAULT_LONGITUDE;
    private _zoom: number = DEFAULT_ZOOM_LEVEL;
    private _style: MapStyle;

    /*****************************************************************************
     * Property getters/setters
     *****************************************************************************/

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

    /*****************************************************************************
     * Private functions
     *****************************************************************************/

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
        canFocus: false,
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

    /**
     * Carry out setting map style after a map style has been selected
     */
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
        maxZoomLevel: MAX_ZOOM_LEVEL,
      });

      const renderer = new Shumate.RasterRenderer({
        id: "cartodb-dark",
        name: "CartoDB Dark",
        license: "",
        dataSource: tileDownloader,
        maxZoomLevel: MAX_ZOOM_LEVEL,
      });

      this.mapView.set_map_source(renderer);
    }

    /**
     * Move map to current lat/lon
     */
    private updateLocation(): void {
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, DEFAULT_ANIMATION_TIME_MS, () => {
        this.viewport.set_location(this._latitude, this._longitude);
        this.viewport.set_zoom_level(this._zoom);
        return false;
      });
    }

    /**
     * Set new lat/lon
     * */
    setLocation(latitude: number, longitude: number, zoom?: number): void {
      this.latitude = latitude;
      this.longitude = longitude;
      if (zoom !== undefined) this.zoom = zoom;
    }

    getViewport(): Shumate.Viewport {
      return this.viewport;
    }

    /**
     * Position map around a set of coordinates
     */
    centerOnRoute(coordinates: Array<{ lat: number; lon: number }>): void {
      if (coordinates.length === 0) return;

      if (coordinates.length === 1) {
        this.animateTo(
          coordinates[0].lat,
          coordinates[0].lon,
          16,
          DEFAULT_ANIMATION_TIME_MS,
        );
        return;
      }

      // Quick maths to find appropriate zoom level
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
      const adjustedLonDiff = lonDiff * Math.cos((centerLat * Math.PI) / 180);
      const maxDiff = Math.max(latDiff, adjustedLonDiff);

      const zoom = Math.max(5, Math.min(18, 18 - Math.log2(maxDiff * 300)));

      this.animateTo(centerLat, centerLon, zoom, DEFAULT_ANIMATION_TIME_MS);
    }

    /**
     * Animate moving the map to a certain position + zoom level
     */
    animateTo(
      latitude: number,
      longitude: number,
      zoom?: number,
      duration: number = DEFAULT_ANIMATION_TIME_MS,
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

    /**
     * Add a new route to the map
     * Each route consists of an array of coordinates
     * It will be drawn as a line connecting each of the coordinates given
     */
    addRoute(
      coordinates: Array<{ lat: number; lon: number }>,
      color: string = "#ffffff",
    ): void {
      // Each route is added to its own separate path layer
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

    /**
     * Clear all of the routes on the map
     */
    clearRoutes(): void {
      for (let index = 0; index < this.pathLayers.length; index++) {
        const layer = this.pathLayers[index];
        layer.remove_all();
        this.mapView.remove_overlay_layer(layer);
      }
      this.pathLayers = [];
    }

    /**
     * Add a map marker
     */
    addMarker(
      latitude: number,
      longitude: number,
      icon: string,
      size: number = 40,
    ): void {
      // Each marker is added to a new separate marker layer
      // @TODO is this performant? does it matter?
      const markerLayer = new Shumate.MarkerLayer({
        viewport: this.viewport,
      });

      const marker = new Shumate.Marker({
        child: Widget.Image({
          iconName: icon,
          pixelSize: size,
        }),
      });

      marker.set_location(latitude, longitude);
      markerLayer.add_marker(marker);

      this.mapView.add_overlay_layer(markerLayer);
      this.markerLayers.push(markerLayer);
    }

    /**
     * Remove all markers from the map
     */
    clearMarkers(): void {
      for (let index = 0; index < this.markerLayers.length; index++) {
        const layer = this.markerLayers[index];
        layer.remove_all();
        this.mapView.remove_overlay_layer(layer);
      }
      this.markerLayers = [];
    }
  },
);

/*****************************************************************************
 * Factory function
 *****************************************************************************/

export default (props: MapWidgetProps = {}) => {
  return new MapWidget(props);
};
