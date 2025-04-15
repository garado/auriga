import { Widget } from "astal/gtk4";

import { Metronome } from "./Metronome";

export const Tools = () => {
  return Widget.Box({
    cssClasses: ["tools"],
    vexpand: true,
    hexpand: true,
    vertical: true,
    children: [Metronome()],
  });
};
