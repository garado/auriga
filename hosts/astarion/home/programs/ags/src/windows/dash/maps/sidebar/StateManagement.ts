import LocationAutocomplete, {
  PlacePrediction,
} from "@/services/LocationAutocomplete";
import { Variable } from "astal";

// Is sidebar expanded or not
export const sidebarRevealState = Variable(false);

export const origin = Variable(undefined);
export const destination = Variable(undefined);
