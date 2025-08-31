import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Variable } from "astal";

// Is sidebar expanded or not
export const sidebarRevealState = Variable(false);

// Selected origin for trip
export const origin: Variable<PlacePrediction | undefined> =
  Variable(undefined);

// Selected destination for trip
export const destination: Variable<PlacePrediction | undefined> =
  Variable(undefined);
