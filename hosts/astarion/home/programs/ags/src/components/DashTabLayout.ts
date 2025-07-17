/**
 * █▀▄ ▄▀█ █▀ █░█   ▀█▀ ▄▀█ █▄▄   █░░ ▄▀█ █▄█ █▀█ █░█ ▀█▀
 * █▄▀ █▀█ ▄█ █▀█   ░█░ █▀█ █▄█   █▄▄ █▀█ ░█░ █▄█ █▄█ ░█░
 *
 * Provides consistent implementation for dashboard tabs.
 * Includes tab header, action buttons, and page switch buttons.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget } from "astal/gtk4";
import { bind, Variable } from "astal";
import { AnimatedStack, AnimatedStackChild } from "@/components/AnimatedStack";
import { SegmentedButtonGroup } from "@/components/SegmentedButtonGroup";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

export type DashLayoutAction = {
  name: string;
  action: () => void;
};

// Custom type for dash layouts
export type DashLayout = {
  name: string; // Name of tab
  pages: Array<AnimatedStackChild>; // Pages to switch between
  actions?: DashLayoutAction[]; // Global actions for the tab
  cssClasses?: Array<string>;
};

interface DashTabWidget extends Gtk.Box {
  controller?: Gtk.EventControllerKey;
}

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

export const DashTabLayout = (dashLayout: DashLayout) => {
  const activePage: Variable<string> = Variable(dashLayout.pages[0].name);

  const PageButtonContainer = () =>
    SegmentedButtonGroup({
      exclusive: true,
      active: true,
      buttons: dashLayout.pages.map((page) => {
        return {
          name: page.name,
          active: bind(activePage).as((activeName) => activeName == page.name),
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

  const PageStack = AnimatedStack({
    cssClasses: [...["page-stack"], ...(dashLayout.cssClasses || [])],
    children: dashLayout.pages,
    activePageName: activePage,
  });

  return Widget.Box({
    cssClasses: ["tab-layout"],
    orientation: Gtk.Orientation.VERTICAL,
    canFocus: true,
    children: [HeaderBar, PageStack],
    setup: (self) => {
      const controller = new Gtk.EventControllerKey();
      (self as DashTabWidget).controller = controller;
      self.add_controller(controller);

      controller.connect("key-pressed", (controller, keyval) => {
        log("dashKeyController", "DashTabLayout");
        switch (keyval) {
          default:
            controller.forward(PageStack);
            return false;
        }
      });
    },
  });
};
