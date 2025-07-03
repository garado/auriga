/* A stack of widgets with built-in arrow buttons to cycle between widgets in the stack.
 * The widget stack wraps around when navigating. */

import { astalify, Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";

export type DropDownProps = {
  exclusive: boolean;
};

export const Dropdown = (props: DropDownProps) => {
  const dd = astalify(Gtk.DropDown);

  const CustomDropdown = dd({});

  return CustomDropdown;
};
