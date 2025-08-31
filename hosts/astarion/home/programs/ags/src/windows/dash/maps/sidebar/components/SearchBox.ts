import { Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";

import { Prediction } from "./Prediction";
import LocationAutocomplete, {
  PlacePrediction,
} from "@/services/LocationAutocomplete";

const autocomplete = LocationAutocomplete.get_default();

export const SearchBox = (props: {
  placeholder: string;
  selectionTarget: Variable<PlacePrediction | undefined>;
  contentTarget: Gtk.Box;
}) => {
  return Widget.Entry({
    placeholderText: props.placeholder,
    onActivate: async (self) => {
      try {
        const responses = await autocomplete.searchNear(self.text);
        props.contentTarget.children = responses.map((resp) => {
          return Prediction(resp, props.selectionTarget);
        });
      } catch (error) {
        console.log(error);
      }
    },
    setup: (self) => {
      props.selectionTarget.subscribe(
        (originPrediction: PlacePrediction | undefined) => {
          self.text = originPrediction?.displayPlace || "";
        },
      );
    },
  });
};
