import { Gdk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import Pp, { AstalPowerProfilesProfile } from "gi://AstalPowerProfiles";

const pp = Pp.get_default();

export const PowerProfiles = (globalRevealerState: Variable<boolean>) => {
  const PowerProfile = (profile: AstalPowerProfilesProfile) =>
    Widget.Box({
      vertical: false,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      children: [
        Widget.Label({
          label: `${profile.profile}`,
        }),
      ],
      onButtonPressed: () => {
        pp.set_active_profile(profile.profile);
      },
    });

  return ExpansionPanel({
    icon: "lightning-symbolic",
    label: bind(pp, "active-profile"),
    children: bind(pp, "profiles").as((pp) => pp.map(PowerProfile)),
    cssClasses: ["power-profiles"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
