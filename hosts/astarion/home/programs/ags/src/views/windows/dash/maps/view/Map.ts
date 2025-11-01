import { MapWidget } from "@/views/components/Map";
import MapsController from "../controller";

export default () => {
  const controller = MapsController.get_default();

  const map = new MapWidget({
    zoom: 12,
    style: "dark",
  });

  // Update map on entering ITINERARY_SELECT state
  controller.connect("notify::current-trip-plan", () => {
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

    controller.previewedItinerary = tripPlan.plan.itineraries[0];
  });

  // Update map with itinerary preview
  controller.connect("notify::previewed-itinerary", () => {
    const itinerary = controller.previewedItinerary;
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

  // When itinerary is selected, show detailed itinerary on map
  controller.connect("notify::selected-itinerary", () => {
    const itinerary = controller.selectedItinerary;
    if (itinerary === undefined) return;

    // Focus map on starting point of trip
    const startPoint = itinerary.legs[0].from;
    map.animateTo(startPoint.lat, startPoint.lon, 12);
  });

  return map;
};
