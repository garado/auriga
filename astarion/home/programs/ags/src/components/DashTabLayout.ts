
/* █▀▄ ▄▀█ █▀ █░█   ▀█▀ ▄▀█ █▄▄   █░░ ▄▀█ █▄█ █▀█ █░█ ▀█▀ */
/* █▄▀ █▀█ ▄█ █▀█   ░█░ █▀█ █▄█   █▄▄ █▀█ ░█░ █▄█ █▄█ ░█░ */

/* Provides consistent implementation for dashboard tabs. 
 * Includes tab header, action buttons, and page switch buttons. */

import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'
import { SegmentedButtonGroup } from './SegmentedButtonGroup.ts'
import { SmartStack } from './SmartStack.ts'

export type DashLayoutAction = {
  name:   string;
  action: () => void;
}

/**
 * Custom type for dash layouts
 */
export type DashLayout = {
  name:         string;  /* Name of tab */
  pages:        array;   /* Pages to switch between */
  actions?:     DashLayoutAction[];   /* Global actions for the tab */
  cssClasses?:  Array<string>;
}

export const DashTabLayout = (dashLayout: DashLayout) => {
  const activePage = Variable(dashLayout.pages[0].name)

  const ActionButton = () => {

  }

  const ActionButtonContainer = () => {

  }
  
  const PageButtonContainer = () => SegmentedButtonGroup({
    exclusive: true,
    autosetFirstChecked: true,
    buttons: dashLayout.pages.map(page => {
      return {
        name: page.name,
        action: () => { activePage.set(page.name) }
      }
    })
  })

  const HeaderBar = () => Widget.CenterBox({
    cssClasses: ['tab-header'],
    startWidget: Widget.Label({
      label: dashLayout.name
    }),
    endWidget: PageButtonContainer(),
  })

  const PageStack = () => SmartStack({
    cssClasses: [...['page-stack'], ...dashLayout.cssClasses],
    children: dashLayout.pages,
    bindNamedSwitchTo: activePage,
  })

  /**
   * The final widget to return
   */
  const FinalWidget = Widget.Box({
    cssClasses: ['tab-layout'],
    orientation: 1,
    children: [
      HeaderBar(),
      PageStack(),
    ]
  })

  return FinalWidget
}
