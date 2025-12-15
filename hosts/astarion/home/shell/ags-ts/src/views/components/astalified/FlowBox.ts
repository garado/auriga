/**
 * █▀▀ █░░ █▀█ █░█░█   █▄▄ █▀█ ▀▄▀
 * █▀░ █▄▄ █▄█ ▀▄▀▄▀   █▄█ █▄█ █░█
 *
 * Gtk.FlowBox, but fully astalified
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gtk, ConstructProps } from "astal/gtk4";

/*****************************************************************************
 * Factory
 *****************************************************************************/

type FlowBoxProps = Partial<ConstructProps<Gtk.FlowBox, Gtk.FlowBox>> & {
  children?: Gtk.Widget[];
};

export default (props: FlowBoxProps = {}) => {
  const { children, ...gtkProps } = props;

  const flowBox = astalify(Gtk.FlowBox)(gtkProps);

  if (children) {
    for (let i = 0; i < children.length; i++) {
      flowBox.append(children[i]);
    }
  }

  return flowBox;
};
