import { DashTabLayout } from "@/components/DashTabLayout.ts";
import { Overview } from "@/windows/dash/ledger/overview";
import { Fire } from "@/windows/dash/ledger/fire";
import { Analytics } from "@/windows/dash/ledger/analytics";

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
