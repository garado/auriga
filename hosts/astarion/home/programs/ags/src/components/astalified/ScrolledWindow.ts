/**
 * Gtk.ScrolledWindow, but fully astalified
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gtk, ConstructProps } from "astal/gtk4";

/*****************************************************************************
 * Factory
 *****************************************************************************/

type ScrolledWindowProps = Partial<
  ConstructProps<Gtk.ScrolledWindow, Gtk.ScrolledWindow>
> & {
  hscrollbar_policy?: Gtk.PolicyType;
  vscrollbar_policy?: Gtk.PolicyType;
  child?: Gtk.Widget;
};

export default (props: ScrolledWindowProps = {}) => {
  const { hscrollbar_policy, vscrollbar_policy, child, ...gtkProps } = props;

  const scrolledWindow = astalify(Gtk.ScrolledWindow)(gtkProps);

  if (hscrollbar_policy) {
    scrolledWindow.hscrollbar_policy = hscrollbar_policy;
  }

  if (vscrollbar_policy) {
    scrolledWindow.vscrollbar_policy = vscrollbar_policy;
  }

  scrolledWindow.set_child(child);

  return scrolledWindow;
};
