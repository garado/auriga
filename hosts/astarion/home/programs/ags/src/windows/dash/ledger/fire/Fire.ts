import { Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import Ledger from "@/services/Ledger";
import InteractiveGraph, {
  GraphData,
  GridData,
} from "@/components/InteractiveGraph";

export const Fire = () => {
  const ledger = Ledger.get_default();

  return Widget.Box({
    children: [
      InteractiveGraph({
        wRequest: 1000,
        hRequest: 1000,
        yIntersectLabel: true,
        grid: {
          enable: true,
          xStepPercent: 15,
          yStepPercent: 10,
        },
        graphs: [
          {
            name: "Balance over time",
            values: bind(ledger, "balances-over-time"),
            calculateFit: true,
            cssClass: "balance",
            xIntersect: {
              enable: true,
              label: true,
              labelTransform: (x) => {
                if (x > 1000000) {
                  return `${(x / 1000000).toFixed(2)}m`;
                } else {
                  return `${Math.round(x / 1000)}k`;
                }
              },
            },
          },
          {
            name: "FIRE target",
            values: Array.from({ length: 365 * 2 }, (_, i) => i * 160),
            cssClass: "target",
            dashed: true,
            xIntersect: {
              enable: true,
              label: true,
              labelTransform: (x) => {
                if (x > 1000000) {
                  return `${(x / 1000000).toFixed(2)}m`;
                } else {
                  return `${Math.round(x / 1000)}k `;
                }
              },
            },
          },
        ],

        cssClass: "fire-graph",
      }),
    ],
  });
};
