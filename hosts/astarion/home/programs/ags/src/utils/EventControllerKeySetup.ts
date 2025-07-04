import { Gtk, Gdk } from "astal/gtk4";

export const EventControllerKeySetup = (props: {
  name?: string;
  widget: Gtk.Widget;
  binds: Object;
  forwardTo?: Function | Gtk.Widget | null;
}) => {
  props.widget.controller = new Gtk.EventControllerKey(); // @ts-ignore

  props.widget.add_controller(props.widget.controller); // @ts-ignore

  props.widget.controller.connect("key-pressed", (_, keyval) => {
    const keyvalStr = Gdk.keyval_name(keyval);

    log(
      "eventControllerKey",
      `${props.name || "Unnamed controller"}: ${keyvalStr}`,
    );

    if (props.binds[keyvalStr]) {
      props.binds[keyvalStr]();
      return true;
    } else {
      let child = undefined;

      if (props.forwardTo != undefined) {
        if (typeof props.forwardTo == "function") {
          child = props.forwardTo();
        } else {
          child = props.forwardTo;
        }

        props.widget.controller.forward(child);
      }
      return false;
    }
  });
};
