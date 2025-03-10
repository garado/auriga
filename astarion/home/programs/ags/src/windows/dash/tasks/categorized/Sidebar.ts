import Tasks, { Task } from "@/services/Tasks";
import { Gdk, Gtk, Widget, astalify, hook } from "astal/gtk4";
import { bind } from "astal";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";

const ts = Tasks.get_default();

const SectionHeader = (text: string) =>
  Widget.Label({
    xalign: 0,
    cssClasses: ["header"],
    label: text,
  });

/**
 * Category selection
 */
const Categories = () => {
  const Category = (category: string) =>
    Widget.Label({
      xalign: 0,
      cssClasses: bind(ts, "selectedTag").as((st) =>
        st == category ? ["active"] : [],
      ),
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      label: category,
      onButtonPressed: (self) => {
        ts.selectedTag = self.label;
      },
    });

  return Widget.Box({
    vertical: true,
    spacing: 12,
    children: [
      SectionHeader("Categories"),
      bind(ts, "tags").as((c) => c?.map(Category)),
    ],
    setup: (self) => {
      EventControllerKeySetup({
        name: "Tasks",
        widget: self,
        forwardTo: null,
        binds: {},
      });
    },
  });
};

/**
 * Subcategory selection
 */
const Subcategories = () => {
  const Subcategory = (subcat: string) =>
    Widget.Label({
      xalign: 0,
      cssClasses: bind(ts, "selectedProject").as((sp) =>
        sp == subcat ? ["active"] : [],
      ),
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      label: subcat,
      onButtonPressed: (self) => {
        ts.selectedProject = self.label;
      },
    });

  return Widget.Box({
    vertical: true,
    spacing: 12,
    children: [
      SectionHeader("Subcategories"),
      bind(ts, "selectedTag").as((tag) =>
        tag ? ts.projectsInTag(tag).map(Subcategory) : [],
      ),
    ],
    setup: (self) => {
      EventControllerKeySetup({
        name: "Tasks",
        widget: self,
        forwardTo: null,
        binds: {},
      });
    },
  });
};

const SortAndFilter = () => {
  return Widget.Box({
    vertical: true,
    children: [SectionHeader("Sort and filter")],
  });
};

export default () =>
  Widget.Box({
    cssClasses: ["widget-container", "sidebar"],
    vertical: true,
    children: [Categories(), Subcategories(), SortAndFilter()],
  });
