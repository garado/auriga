import { Widget } from "astal/gtk4";
import { MonthlySpendBarGraph } from "./MonthlySpendBarGraph";

export const Analytics = () => {
  return Widget.Box({
    vertical: false,
    hexpand: true,
    vexpand: true,
    children: [MonthlySpendBarGraph()],
  });
};
