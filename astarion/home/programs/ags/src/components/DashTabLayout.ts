
/* █▀▄ ▄▀█ █▀ █░█   ▀█▀ ▄▀█ █▄▄   █░░ ▄▀█ █▄█ █▀█ █░█ ▀█▀ */
/* █▄▀ █▀█ ▄█ █▀█   ░█░ █▀█ █▄█   █▄▄ █▀█ ░█░ █▄█ █▄█ ░█░ */

/* Provides consistent implementation for dashboard tabs. 
 * Includes tab header, action buttons, and page switch buttons. */

import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

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

  const PageButton = () => {

  }

  const ActionButtonContainer = () => {

  }
  
  const PageButtonContainer = () => {

  }

  const HeaderBar = () => Widget.CenterBox({
    cssClasses: ['tab-header'],
    startWidget: Widget.Label({
      label: dashLayout.name
    })
  })

  const PageStack = () => Widget.Stack({
    cssClasses: [...['page-stack'], ...dashLayout.cssClasses],
    setup: self => {
      dashLayout.pages.map(page => self.add_named(page.page(), page.name))
      activePage.subscribe(name => self.visibleChildName = name)
    }
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
