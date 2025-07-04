
/* █▀▄ ▄▀█ █▀ █░█   ▀█▀ ▄▀█ █▄▄   █░░ ▄▀█ █▄█ █▀█ █░█ ▀█▀ */
/* █▄▀ █▀█ ▄█ █▀█   ░█░ █▀█ █▄█   █▄▄ █▀█ ░█░ █▄█ █▄█ ░█░ */

/* Provides consistent implementation for dashboard tabs. 
 * Includes tab header, action buttons, and page switch buttons. */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'

/** 
 * @param args.name     tab label to display
 * @param args.pages    array of different pages to switch through
 * @param args.actions  widget to display in top left
 */
export default (args) => {
  let PageStack
  let lastPageIndex = 0
  const numPages = args.pages.length

  const ActionButton = (action) => Widget.Button({
    className: 'action-btn',
    canFocus: false,
    vpack: 'center',
    child: Widget.Label(action.name),
    onPrimaryClick: action.onPrimaryClick,
  })

  const PageButton = (page) => Widget.Button({
    className: 'action-btn',
    canFocus: false,
    child: Widget.Label(page.name),
    attribute: page,
    onPrimaryClick: (self) => {
      if (args.pages.indexOf(page) < lastPageIndex) {
        PageStack.transition = 'slide_right'
      } else {
        PageStack.transition = 'slide_left'
      }

      PageStack.shown = page.name

      lastPageIndex = args.pages.indexOf(page)
    }
  })

  /**
   * Action buttons for the tab.
   */
  const ActionButtonContainer = Widget.Box({
    hpack: 'end',
    spacing: 4,
    setup: self => {
      if (!args.actions) return
      self.children = args.actions.map(ActionButton)
    }
  })

  /**
   * Shows currently visible page.
   */
  PageStack = Widget.Stack({
    transition: 'slide_right',
    setup: self => {
      const contentKeyValue = {}
      args.pages.forEach(page => {
        contentKeyValue[page.name] = page
      })
      self.children = contentKeyValue
    }
  })

  /**
   * Buttons to switch the currently visible page.
   */
  const PageSwitcher = Widget.Box({
    spacing: 10,
    vpack: 'center',
    hpack: 'end',
    setup: self => {
      // if (args.pages.length == 1) return      
      self.children = args.pages.map(PageButton)
    }
  })

  const TabHeader = Widget.Label({
    className: 'header',
    vpack: 'center',
    hpack: 'start',
    label: args.name,
    useMarkup: true,
  })

  const HeaderBar = Widget.CenterBox({
    hexpand: true,

    startWidget: TabHeader,

    endWidget: Widget.Box({
      hpack: 'end',
      spacing: 8,
      children: [
        ActionButtonContainer,
        PageSwitcher,
      ],
    })
  })

  const Return = Widget.Box({
    className: 'dashtab',
    vertical: true,
    spacing: 12,
    children: [
      HeaderBar,
      PageStack,
    ],

    // Provide functions
    attribute: {
      'setHeader': (header) => {
        TabHeader.label = header
      },
    },
  })

  /* Create functions for box */
  Object.assign(Return, {
    'setHeader': (header) => {
      TabHeader.label = header
    },

    'iterTab': (dir) => {
      /* Iter with no wrapping */
      let newIndex = lastPageIndex + (1 * dir)
      if (newIndex < 0) newIndex = 0
      if (newIndex > numPages - 1) newIndex = numPages - 1
      PageSwitcher.children[newIndex].onPrimaryClick()
    },
  })

  return Return
}
