/* █▀▄ ▄▀█ █▀ █░█   ▀█▀ ▄▀█ █▄▄   █░░ ▄▀█ █▄█ █▀█ █░█ ▀█▀ */
/* █▄▀ █▀█ ▄█ █▀█   ░█░ █▀█ █▄█   █▄▄ █▀█ ░█░ █▄█ █▄█ ░█░ */

/* Provides consistent implementation for dashboard tabs.
 * Includes tab header, action buttons, and page switch buttons. */

import { Gtk, Gdk, Widget } from "astal/gtk4";
import { Variable } from "astal";
import { SegmentedButtonGroup } from "@/components/SegmentedButtonGroup";
import { SmartStack } from "@/components/SmartStack";

export type DashLayoutAction = {
  name: string;
  action: () => void;
};

/**
 * Custom type for dash layouts
 */
export type DashLayout = {
  name: string /* Name of tab */;
  pages: Array<Object> /* Pages to switch between */;
  actions?: DashLayoutAction[] /* Global actions for the tab */;
  cssClasses?: Array<string>;
};

export const DashTabLayout = (dashLayout: DashLayout) => {
  const activePage = Variable(dashLayout.pages[0].name);

  const ActionButton = () => {};

  const ActionButtonContainer = () => {};

  const PageButtonContainer = () =>
    SegmentedButtonGroup({
      exclusive: true,
      active: true,
      buttons: dashLayout.pages.map((page) => {
        return {
          name: page.name,
          action: () => {
            activePage.set(page.name);
          },
        };
      }),
    });

  const HeaderBar = Widget.CenterBox({
    cssClasses: ["tab-header"],
    startWidget: Widget.Label({
      label: dashLayout.name,
    }),
    endWidget: PageButtonContainer(),
  });

  const PageStack = SmartStack({
    cssClasses: [...["page-stack"], ...dashLayout.cssClasses],
    children: dashLayout.pages,
    bindNamedSwitchTo: activePage,
  });

  /**
   * The final widget to return
   */
  const FinalWidget = Widget.Box({
    cssClasses: ["tab-layout"],
    orientation: 1,
    canFocus: true,
    children: [HeaderBar, PageStack],
    setup: (self) => {
      self.controller = new Gtk.EventControllerKey();
      self.add_controller(self.controller);
      self.controller.connect("key-pressed", (controller, keyval) => {
        log("dashKeyController", "DashTabLayout");
        switch (keyval) {
          default:
            controller.forward(PageStack);
            return false;
        }
      });
    },
  });

  return FinalWidget;
};
