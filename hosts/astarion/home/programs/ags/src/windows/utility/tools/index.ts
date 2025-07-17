import { Widget } from "astal/gtk4";

import { Metronome } from "./Metronome";
import Calculator from "./Calculator";

export const Tools = () => {
  return Widget.Box({
    cssClasses: ["tools"],
    vexpand: true,
    hexpand: true,
    vertical: true,
    spacing: 20,
    children: [Metronome(), Calculator()],
  });
};
