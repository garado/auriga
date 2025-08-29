/*****************************************************************************
 * Imports
 *****************************************************************************/

import { bind, Variable } from "astal";
import { Gtk, Widget } from "astal/gtk4";

/*****************************************************************************
 * Widget
 *****************************************************************************/

const sidebarRevealState = Variable(false);

export default () => {
  const searchBar = Widget.Entry({
    cssClasses: ["search"],
  });

  const sidebarContent = Widget.Box({
    cssClasses: bind(sidebarRevealState).as((state) => [
      "sidebar",
      ...(state ? ["expanded"] : []),
    ]),
    vexpand: true,
    vertical: true,
    children: [searchBar, Widget.Label({ label: "SIDEBAR!" })],
  });

  const sidebarHandle = Widget.Box({
    cssClasses: ["sidebar-handle"],
    vexpand: true,
    children: [
      Widget.Button({
        child: Widget.Label({ label: "!!!" }),
        onButtonPressed: () => {
          sidebarRevealState.set(!sidebarRevealState.get());
        },
      }),
    ],
  });

  const sidebarRevealer = Widget.Revealer({
    canTarget: true,
    child: sidebarContent,
    transitionType: Gtk.RevealerTransitionType.SLIDE_RIGHT,
    revealChild: bind(sidebarRevealState),
  });

  return Widget.Box({
    halign: Gtk.Align.END,
    vertical: false,
    hexpand: true,
    children: [sidebarHandle, sidebarRevealer],
  });
};
