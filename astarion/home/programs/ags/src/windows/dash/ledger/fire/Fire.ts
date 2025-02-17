import { Widget } from "astal/gtk4";

export const Fire = () =>
  Widget.Box({
    children: [Widget.Label({ label: "FIRE page!" })],
  });
