import { bind, timeout } from "astal";
import { App, Astal, Gtk, Widget } from "astal/gtk4";
import { Notification } from "@/components/Notification";
import Nd from "gi://AstalNotifd";

const nd = Nd.get_default();
const references = {};

const NotifWrapper = (notif: any) =>
  Widget.Revealer({
    child: Notification(notif),
    transitionDuration: 200,
    transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
    revealChild: false,
  });

const Notifications = () =>
  Widget.Box({
    name: "notifications",
    cssClasses: ["notification-window"],
    vertical: true,
    vexpand: false,
    hexpand: true,
    spacing: 20,
    setup: (self) => {
      nd.connect("notified", (_, id) => {
        if (!nd.dontDisturb) {
          const n = nd.get_notification(id);
          const widget = NotifWrapper(n);
          references[id] = widget;
          self.append(widget);
          widget.revealChild = true;
        }
      });

      nd.connect("resolved", (_, id) => {
        references[id].revealChild = false;
        timeout(200, () => {
          self.remove(references[id]);
          references[id] = undefined;
        });
      });
    },
  });

export default () => {
  const { TOP, RIGHT } = Astal.WindowAnchor;

  return Widget.Window({
    application: App,
    name: "notifications",
    cssName: "notifications-window",
    keymode: Astal.Keymode.NONE,
    anchor: TOP | RIGHT,
    visible: bind(nd, "notifications").as((n) => n.length > 0),
    child: Notifications(),
    setup: (self) => {
      /* Workaround for revealer bug.
       * https://github.com/wmww/gtk4-layer-shell/issues/60 */
      self.set_default_size(1, 1);
    },
  });
};
