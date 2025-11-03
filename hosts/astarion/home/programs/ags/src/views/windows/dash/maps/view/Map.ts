import { MapWidget } from "@/views/components/Map";
import MapsController, { MapsState } from "../controller";
import { Stop } from "@/services/Transit";

export default () => {
  const controller = MapsController.get_default();

  const map = new MapWidget({
    zoom: 13,
    style: "dark",
  });

  // Update map on entering ENDPOINTS_SELECT state
  const mapUpdate_endpointsSelect = () => {
    map.clearRoutes();
    map.clearMarkers();
  };

  // Update map on entering ITINERARY_SELECT state
  const mapUpdate_itinerarySelect = () => {
    const tripPlan = controller.currentTripPlan;
    if (tripPlan === undefined) return;

    map.clearRoutes();
    map.clearMarkers();

    const coords = [
      { lat: tripPlan.plan.from.lat, lon: tripPlan.plan.from.lon },
      { lat: tripPlan.plan.to.lat, lon: tripPlan.plan.to.lon },
    ];

    map.centerOnRoute(coords);

    map.addMarker(coords[0].lat, coords[0].lon, "map-pin-symbolic");
    map.addMarker(coords[1].lat, coords[1].lon, "map-pin-symbolic");
  };

  // Update map on entering ITINERARY_DISPLAY state
  const mapUpdate_itineraryDisplay = () => {
    const itinerary = controller.selectedItinerary;
    if (itinerary === undefined) return;
  };

  // Update map when an itinerary needs to be previewed
  // (Happens in ITINERARY_SELECT)
  controller.connect("notify::previewed-itinerary", () => {
    const itinerary = controller.previewedItinerary;
    if (itinerary === undefined) return;

    map.clearRoutes();

    const allCoordinates = [];

    // Display individual legs of the trip
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
      allCoordinates.push(...coordinates);
    }

    map.centerOnRoute(allCoordinates);
  });

  // Update map when a location needs to be previewed
  // (Happens in ENDPOINTS_SELECT)
  controller.connect("notify::previewed-location", () => {
    const location = controller.previewedLocation;
    if (location === undefined) return;

    map.clearMarkers();

    const lat = Number(location.lat);
    const lon = Number(location.lon);

    map.addMarker(lat, lon, "map-pin-symbolic", 48);
    map.centerOnRoute([{ lat: lat, lon: lon }]);
  });

  // Update map widget when the controller state changes
  controller.connect("notify::current-state", () => {
    const state = controller.currentState;

    switch (state) {
      case MapsState.ENDPOINTS_SELECT: {
        mapUpdate_endpointsSelect();
        break;
      }
      case MapsState.ITINERARY_SELECT: {
        mapUpdate_itinerarySelect();
        break;
      }

      case MapsState.ITINERARY_DISPLAY: {
        mapUpdate_itineraryDisplay();
        break;
      }

      default:
        break;
    }
  });

  return map;
};
