
/* █▀ █▀▀ █▀▀ █▀▄▀█ █▀▀ █▄░█ ▀█▀ █▀▀ █▀▄   █▄▄ █░█ ▀█▀ ▀█▀ █▀█ █▄░█ */
/* ▄█ ██▄ █▄█ █░▀░█ ██▄ █░▀█ ░█░ ██▄ █▄▀   █▄█ █▄█ ░█░ ░█░ █▄█ █░▀█ */

/* Attempts to implement Material Design segmented button group */

import { App, Astal, Gtk, Gdk, Widget, astalify } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

const ToggleButton = astalify(Gtk.ToggleButton)

export type SegmentedButtonProps = {
  name:   string;
  action: () => void;
}

export const SegmentedButtonGroup = (props: {
  buttons: Array<SegmentedButtonProps>,
  autosetFirstChecked?: bool,
  exclusive?: bool,
}) => {
  const Container = Widget.Box({
    orientation: 0,
    spacing: 0,
    cssClasses: ['segmented-toggle-button-container'],
    children: props.buttons.map(btn => ToggleButton({
      cssClasses: ['segmented-toggle-button'],
      label: btn.name,
      onClicked: btn.action,
    }))
  })

  /* Add to button group, where only one button is active at a time */
  if (props.exclusive) {
    const group = Container.get_children()[0]

    Container.get_children().slice(1).map(btn => {
      btn.set_group(group)
    })
  }

  if (props.autosetFirstChecked) {
    Container.get_children()[0].set_active(true)
  }

  return Container
}
