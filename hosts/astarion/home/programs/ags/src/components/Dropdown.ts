/**
 * █▀▄ █▀█ █▀█ █▀█ █▀▄ █▀█ █░█░█ █▄░█
 * █▄▀ █▀▄ █▄█ █▀▀ █▄▀ █▄█ ▀▄▀▄▀ █░▀█
 *
 * Wrapper for GtkDropDown.
 * Currently doesn't do much. But it's here so it can be extended if needed.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gtk } from "astal/gtk4";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

export type DropDownProps = {
  exclusive?: boolean;
  cssClasses?: string[];

  /** Gtk List Model used to set the dropdown options */
  model?: Gtk.StringList;

  /** Index of the currently selected item in the list model */
  selected?: number;

  /** */
  onSelectionChanged?: () => void;
};

/*****************************************************************************
 * Main widget definition
 *****************************************************************************/

export const Dropdown = (props: DropDownProps) => {
  const dd = astalify(Gtk.DropDown);

  const customDropdown = dd({
    cssClasses: props.cssClasses,
  });

  if (props.model) {
    customDropdown.set_model(props.model);
  }

  if (props.selected) {
    customDropdown.set_selected(props.selected);
  }

  if (props.onSelectionChanged) {
    customDropdown.connect("notify::selected", props.onSelectionChanged);
  }

  return customDropdown;
};
