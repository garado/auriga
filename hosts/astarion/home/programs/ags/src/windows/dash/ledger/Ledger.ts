import { DashTabLayout } from "@/components/DashTabLayout.ts";
import { Overview } from "@/windows/dash/ledger/overview/Overview.ts";
import { Fire } from "@/windows/dash/ledger/fire/Fire.ts";
import { Analytics } from "@/windows/dash/ledger/analytics/Analytics.ts";

export default () => {
  return DashTabLayout({
    name: "Ledger",
    cssClasses: ["ledger"],
    pages: [
      { name: "Overview", ui: Overview },
      { name: "Analytics", ui: Analytics },
      { name: "FIRE", ui: Fire },
    ],
  });
};
