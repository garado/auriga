/* █▀▄ █▀█ █▀█ █▀█ █▀▄ █▀█ █░█░█ █▄░█ */
/* █▄▀ █▀▄ █▄█ █▀▀ █▄▀ █▄█ ▀▄▀▄▀ █░▀█ */

/* Wrapper for GtkDropDown.
 * Currently doesn't do much. But it's here so it can be extended if needed. */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gtk } from "astal/gtk4";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

export type DropDownProps = {
  exclusive: boolean;
};

/*****************************************************************************
 * Main widget definition
 *****************************************************************************/

export const Dropdown = (props: DropDownProps) => {
  const dd = astalify(Gtk.DropDown);

  const CustomDropdown = dd({});

  return CustomDropdown;
};
