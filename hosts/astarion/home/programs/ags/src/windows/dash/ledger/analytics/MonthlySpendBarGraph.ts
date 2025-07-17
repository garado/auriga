import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import Ledger from "@/services/Ledger";
import { bind } from "astal";
import Bar from "./BarGraphBar";

let maximum = 0;
const DrawingArea = astalify(Gtk.DrawingArea);

const GroupByCategoryThenMonth = (msbc) => {
  maximum =
    Object.values(msbc.subcategories)
      .flatMap((sub) => sub.subtotal)
      .reduce((max, num) => Math.max(max, num), -Infinity) || null;

  const Container = Widget.Box({
    vertical: false,
    hexpand: true,
    vexpand: true,
    spacing: 20,
  });

  for (const subcat in msbc.subcategories) {
    const data = msbc.subcategories[subcat].subtotal;

    const GraphBox = Widget.Box({
      vertical: false,
      spacing: 5,
      halign: Gtk.Align.CENTER,
      children: data.map((total: number) =>
        Widget.Box({
          vertical: true,
          children: [
            Bar({
              heightRequest: 500,
              widthRequest: 10,
              value: total,
              minValue: 0,
              maxValue: maximum,
            }),
            Widget.Label({
              halign: Gtk.Align.CENTER,
              label: "J",
            }),
          ],
        }),
      ),
    });

    const Ugh = Widget.Box({
      vertical: true,
      children: [
        GraphBox,
        Widget.Label({
          label: subcat,
        }),
        Widget.Label({
          label: `Average:`,
        }),
        Widget.Label({
          label: `${(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2)}`,
        }),
      ],
    });

    Container.append(Ugh);
  }

  return Container;
};

export const MonthlySpendBarGraph = () => {
  const ls = Ledger.get_default();

  return Widget.Box({
    name: "Spending by category, then by month",
    cssClasses: ["widget-container", "bar-graph"],
    vertical: true,
    hexpand: true,
    vexpand: true,
    children: [
      Widget.Label({
        cssClasses: ["widget-header"],
        label: "Spending by category, then by month",
      }),
      Widget.Box({
        halign: Gtk.Align.CENTER,
        children: bind(ls, "monthlySpendingByCategory").as((msbc) =>
          GroupByCategoryThenMonth(msbc),
        ),
      }),
    ],
  });
};
