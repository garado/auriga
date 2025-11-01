/**
 * █▀ █▀▀ ▄▀█ █▀█ █▀▀ █░█   █▄▄ █▀█ ▀▄▀
 * ▄█ ██▄ █▀█ █▀▄ █▄▄ █▀█   █▄█ █▄█ █░█
 *
 * Where user enters query for location endpoint (origin/destination)
 */

import { Gdk, Widget } from "astal/gtk4";
import { Variable } from "astal";

import { Prediction } from "./Prediction";
import LocationAutocomplete, {
  PlacePrediction,
} from "@/services/LocationAutocomplete";
import { sidebarContent, tripPlan } from "../../StateManagement";

export const SearchBox = (props: {
  /** Placeholder text for the search box */
  placeholder: string;

  /** The PlacePrediction that this search box is for (either Origin or Destination) */
  selectionTarget: Variable<PlacePrediction | undefined>;
}) => {
  return Widget.Entry({
    placeholderText: props.placeholder,
    onNotifyText: (self) => {
      if (self.text !== props.selectionTarget.get()?.displayPlace) {
        props.selectionTarget.set(undefined);
      }
    },
    onActivate: async (self) => {
      // Call locationIQ API to autocomplete location
      try {
        const responses = await LocationAutocomplete.get_default().searchNear(
          self.text,
        );
        sidebarContent.children = responses.map((resp) => {
          tripPlan.set(undefined);
          return Prediction(resp, props.selectionTarget);
        });
      } catch (error) {
        console.log(error);
      }
    },
    setup: (self) => {
      props.selectionTarget.subscribe(
        (selectionPrediction: PlacePrediction | undefined) => {
          if (selectionPrediction !== undefined) {
            self.text = selectionPrediction.displayPlace ?? "";
          }
        },
      );
    },
  });
};
