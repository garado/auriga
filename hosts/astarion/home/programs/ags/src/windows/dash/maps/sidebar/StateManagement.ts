import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Variable } from "astal";

// Is sidebar expanded or not
export const sidebarRevealState = Variable(false);

// Selected origin for trip
export const origin: Variable<PlacePrediction> = Variable(undefined as any);

// Selected destination for trip
export const destination: Variable<PlacePrediction> = Variable(
  undefined as any,
);
