import { Gdk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import Nw, { AstalNetworkAccessPoint } from "gi://AstalNetwork";

const nw = Nw.get_default();

export const Network = (globalRevealerState: Variable<boolean>) => {
  const NetworkItem = (ap: AstalNetworkAccessPoint) =>
    Widget.Box({
      visible: ap.ssid != undefined,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      children: [
        Widget.Label({
          label: ap.ssid,
        }),
      ],
      onButtonPressed: () => {
        nw.set_active_connection(ap.ssid);
      },
    });

  return ExpansionPanel({
    icon: "wifi-high-symbolic",
    label: bind(nw.wifi, "ssid"),
    // label: bind(pp, "active-profile"),
    // children: bind(pp, "profiles").as((pp) => pp.map(NetworkItem)),
    children: bind(nw.wifi, "access-points").as((ap) => ap.map(NetworkItem)),
    cssClasses: ["wifi"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
