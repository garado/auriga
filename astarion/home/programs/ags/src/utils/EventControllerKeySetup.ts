import { Gtk, Gdk } from "astal/gtk4";

export const EventControllerKeySetup = (props: {
  widget: Gtk.Widget;
  binds: Object;
  forwardTo: Function | Gtk.Widget;
}) => {
  props.widget.controller = new Gtk.EventControllerKey(); // @ts-ignore

  props.widget.add_controller(props.widget.controller); // @ts-ignore

  props.widget.controller.connect("key-pressed", (_, keyval) => {
    const keyvalStr = Gdk.keyval_name(keyval);

    if (props.binds[keyvalStr]) {
      props.binds[keyvalStr]();
      return true;
    } else {
      if (props.forwardTo != undefined) {
        if (typeof props.forwardTo == "function") {
          props.widget.controller.forward(props.forwardTo());
        } else {
          props.widget.controller.forward(props.forwardTo);
        }
      }
      return false;
    }
  });
};
