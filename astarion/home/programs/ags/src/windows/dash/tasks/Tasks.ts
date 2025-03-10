import { DashTabLayout } from "@/components/DashTabLayout.ts";
import Categorized from "./categorized/Categorized";

export default () => {
  return DashTabLayout({
    name: "Tasks and things",
    cssClasses: ["tasks"],
    pages: [{ name: "Categorized", ui: Categorized }],
  });
};
