import { DashTabLayout } from "@/components/DashTabLayout.ts";
import Projects from "./projects/Projects";

export default () => {
  return DashTabLayout({
    name: "Tasks and things",
    cssClasses: ["tasks"],
    pages: [{ name: "Projects", ui: Projects }],
  });
};
