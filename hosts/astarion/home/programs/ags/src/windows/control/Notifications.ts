import { bind } from "astal";
import { Gtk, Widget } from "astal/gtk4";
import { Notification } from "@/components/Notification";
import Nd from "gi://AstalNotifd";

const nd = Nd.get_default();

export const Notifications = () =>
  Widget.Box({
    name: "notifications",
    cssClasses: ["notifications"],
    vertical: true,
    vexpand: false,
    hexpand: true,
    spacing: 20,
    children: [
      Widget.Label({
        cssClasses: ["section-header"],
        xalign: 0,
        label: "Notifications",
      }),
      bind(nd, "notifications").as((notifs) => {
        if (notifs.length > 0) {
          return notifs.map(Notification);
        } else {
          return Widget.Label({
            xalign: 0,
            cssClasses: ["placeholder"],
            label: "No notifications.",
          });
        }
      }),
    ],
  });
