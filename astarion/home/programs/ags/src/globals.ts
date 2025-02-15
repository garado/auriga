import Gtk from "gi://Gtk"

declare global {
  const START: number
  const CENTER: number
  const END: number
  const FILL: number
}

Object.assign(globalThis, {
  START: Gtk.Align.START,
  CENTER: Gtk.Align.CENTER,
  END: Gtk.Align.END,
  FILL: Gtk.Align.FILL,
})
