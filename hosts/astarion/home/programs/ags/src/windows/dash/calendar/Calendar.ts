import { DashTabLayout } from "@/components/DashTabLayout";
import { Week } from "@/windows/dash/calendar/week/Week";
import { Schedule } from "@/windows/dash/calendar/schedule/Schedule";

export default () => {
  return DashTabLayout({
    name: "Calendar",
    cssClasses: ["calendar"],
    pages: [
      { name: "Week", ui: Week },
      { name: "Schedule", ui: Schedule },
    ],
  });
};
