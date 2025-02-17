import { DashTabLayout } from "@/components/DashTabLayout.ts";
import { Overview } from "@/windows/dash/ledger/overview/Overview.ts";
import { Fire } from "@/windows/dash/ledger/fire/Fire.ts";

export default () => {
  return DashTabLayout({
    name: "Ledger",
    cssClasses: ["ledger"],
    pages: [
      { name: "Overview", ui: Overview },
      { name: "FIRE", ui: Fire },
    ],
  });
};
