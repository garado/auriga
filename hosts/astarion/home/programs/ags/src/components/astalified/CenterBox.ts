/**
 * █▀▀ █▀▀ █▄░█ ▀█▀ █▀▀ █▀█   █▄▄ █▀█ ▀▄▀
 * █▄▄ ██▄ █░▀█ ░█░ ██▄ █▀▄   █▄█ █▄█ █░█
 *
 * Gtk.CenterBox, but fully astalified
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gtk, ConstructProps } from "astal/gtk4";

/*****************************************************************************
 * Factory
 *****************************************************************************/

type CenterBoxProps = Partial<ConstructProps<Gtk.CenterBox, Gtk.CenterBox>> & {
  vertical?: boolean;
};

export default (props: CenterBoxProps = {}) => {
  const { vertical, ...gtkProps } = props;

  const centerBox = astalify(Gtk.CenterBox)(gtkProps);

  centerBox.orientation = vertical
    ? Gtk.Orientation.VERTICAL
    : Gtk.Orientation.HORIZONTAL;

  return centerBox;
};
