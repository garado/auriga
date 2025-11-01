/**
 * █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
 * ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄
 *
 * Allows user to:
 * - select origin/destination for trips
 * - preview different trip itineraries
 * - select a trip itinerary and view its details
 */

import { bind } from "astal";
import { astalify, Gtk, Widget } from "astal/gtk4";
import MapsController from "../../controller";
import { endpointSelectView } from "./states/EndpointsSelect";
import { itinerarySelectView } from "./states/ItinerarySelect";
import { itineraryDisplayView } from "./states/ItineraryDisplay";

const ScrolledWindow = astalify(Gtk.ScrolledWindow);

const controller = MapsController.get_default();

export default () => {
  const sidebarContent = Widget.Box({
    children: [
      endpointSelectView(),
      itinerarySelectView(),
      itineraryDisplayView(),
    ],
  });

  const sidebar = Widget.Box({
    cssClasses: ["sidebar"],
    vexpand: true,
    hexpand: false,
    halign: Gtk.Align.START,
    overflow: Gtk.Overflow.HIDDEN,
    vertical: true,
    spacing: 8,
    children: [
      ScrolledWindow({
        hscrollbarPolicy: Gtk.PolicyType.NEVER,
        vscrollbarPolicy: Gtk.PolicyType.AUTOMATIC,
        vexpand: true,
        hexpand: true,
        child: new Gtk.Viewport({
          vscrollPolicy: Gtk.ScrollablePolicy.NATURAL,
          child: sidebarContent,
        }),
      }),
    ],
  });

  const sidebarRevealer = Widget.Revealer({
    canTarget: true,
    vexpand: true,
    hexpand: false,
    child: sidebar,
    halign: Gtk.Align.START,
    transitionType: Gtk.RevealerTransitionType.SLIDE_RIGHT,
    revealChild: bind(controller, "sidebarRevealState"),
  });

  return Widget.Box({
    cssClasses: ["sidebar-container"],
    halign: Gtk.Align.END,
    vertical: false,
    hexpand: false,
    children: [sidebarRevealer],
  });
};
