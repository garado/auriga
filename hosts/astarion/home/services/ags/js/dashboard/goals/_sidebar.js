
// █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
// ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import GoalService from '../../services/goals.js'

/*************************************
 * MODULE-LEVEL VARIABLES
 *************************************/

const MAX_WIDTH_CHARS_LABEL = 38

/*************************************
 * TOP
 *************************************/

// Button to close sidebar
const CloseBtn = Widget.EventBox({
  hpack: 'end',
  className: 'close-btn',
  child: Widget.Icon('x-circle-symbolic'),
  onPrimaryClick: () => {
    GoalService.resetSidebarData()
    GoalService.requestSidebar(false)
  }
})

// Button to navigate to the last viewed goal
const Breadcrumbs = Widget.Box({
  spacing: 4,
  hpack: 'start',
  className: 'breadcrumbs',
  children: [
    Widget.EventBox({
      child: Widget.Icon('arrow-left-symbolic'),
      visible: GoalService.bind('sidebar-breadcrumbs').as(x => x.length > 0),
      onPrimaryClick: () => {
        GoalService.followBreadcrumbs(-1)
      }
    }),
  ]
})

/**
 * Badge showing cmopletion status in the top left 
 */
const CompletionStatus = Widget.Label({
  hpack: 'start',
  setup: self => {
    self.hook(GoalService, (self, x) => {
      if (x == undefined || x.status == undefined) return
      self.visible = x.status == 'completed' || x.status == 'failed'

      self.label = x.status.charAt(0).toUpperCase() + x.status.slice(1)

      // self.classNames doesn't play well with reactivity
      self.classNames = ['completion-status', `${x.status}`]
    }, 'sidebar-data-changed')
  }
})

// Header text showing goal name
const Header = Widget.Label({
  className: 'sidebar-header',
  hpack: 'start',
  vpack: 'end',
  vexpand: true,
  hexpand: false,
  wrap: true,
  maxWidthChars: 20,
  label: GoalService.bind('sidebar-data').as(x => x.description),
})

// Just a container for the background image
// It is separate so we can control the image opacity in css
const Image = Widget.Box({
  className: 'background',
  heightRequest: 240,
  vertical: true,
  vexpand: false,
  css: GoalService.bind('sidebar-data').as(x => `background-image: url('${x.imgpath}')`),
})

// The entire top segment of the sidebar
const Top = Widget.Overlay({
  className: 'top',
  vexpand: false,
  child: Image,
  passThrough: true,
  overlays: [
    Widget.CenterBox({
      className: 'navigation',
      vpack: 'start',
      endWidget: CloseBtn,
      startWidget: Breadcrumbs, 
    }),
    Widget.Box({
      vertical: true,
      vpack: 'end',
      vexpand: false,
      children: [
        CompletionStatus,
        Header,
      ]
    })
  ]
})

/*************************************
 * INFORMATION
 *************************************/

// Subheader for goal information
function Subheader(text) {
  return Widget.Label({
    className: 'subheader',
    hpack: 'start',
    label: text,
  })
}

// Widget that links to a goal. Clicking it navigates to that
// goal's page in the sidebar.
function GoalLink(goal) {
  let icon

  if (goal.status == 'completed') {
    icon = 'check-square-symbolic'
  } else if (goal.status == 'failed') {
    icon = 'check-failed-symbolic'
  } else {
    icon = 'square-symbolic'
  }

  // Checkbox to toggle goal completion
  const CheckBox = Widget.EventBox({
    child: Widget.Icon({
      icon: icon,
      vpack: 'center',
    }),
    onPrimaryClick: (self) => {
      GoalService.toggleStatus(goal)
    }
  })

  // Link text
  const Description = Widget.EventBox({
    className: 'description',
    child: Widget.Label({
      vpack: 'center',
      label: goal.status == 'completed' || goal.status == 'failed' ? `<s>${goal.description}</s>` : goal.description,
      maxWidthChars: 28,
      wrap: true,
      useMarkup: true,
    }),
    onPrimaryClick: () => {
      // If clicking the 'Parent Goal' link,
      // it should act exactly the same as following the breadcrumbs backwards.
      const crumbs = GoalService.sidebar_breadcrumbs
      if (crumbs.length > 0 && goal.uuid == crumbs[crumbs.length - 1].uuid) {
        GoalService.followBreadcrumbs(-1)
      } else {
        GoalService.pushBreadcrumb(goal.parent)
        GoalService.sidebar_data = goal
      }
    }
  })

  return Widget.Box({
    className: 'dependency',
    vertical: false,
    spacing: 9,
    children: [
      CheckBox,
      Description,
    ]
  })
}


// List the parent goal
// NOTE: Goals are structured such that each goal has exactly one parent
const Parent = Widget.Box({
  vertical: true,
  visible: GoalService.bind('sidebar-data').as(x => x.parent.description != 'Root'),
  children: [
    Subheader('Parent'),
  ],
  setup: self => self.hook(GoalService, (self) => {
    const data = GoalService.sidebar_data

    if (!data.parent || data.parent.description == 'Root') return

    if (self.children.length > 1) {
      self.children[1].destroy()
    }

    self.add(GoalLink(data.parent))
  }, 'notify::sidebar-data')
})

// Show 'Why' text.
// 'Why' text is a custom UDA where I write my motivation for accomplishing the goal.
const Why = Widget.Box({
  vertical: true,
  hexpand: false,
  visible: GoalService.bind('sidebar-data').as(x => x.why ? true : false),
  children: [
    Subheader('Why'),
    Widget.Label({
      hpack: 'start',
      wrap: true,
      maxWidthChars: MAX_WIDTH_CHARS_LABEL,
      label: GoalService.bind('sidebar-data').as(x => x.why ? x.why : '')
    }),
  ]
})

// Show list of dependencies (subgoals).
const Dependencies = Widget.Box({
  visible: GoalService.bind('sidebar-data').as(x => x.children.length > 0),
  vertical: true,
  children: [
    Subheader('Subgoals'),
    Widget.Box({
      spacing: 2,
      vertical: true,
      children: GoalService.bind('sidebar-data').as(d => d.children.map(GoalLink))
      // children: GoalService.bind('sidebar-data').as(d => d.children.sort((a,b) => a.due < b.due).map(GoalLink))
    })
  ]
})

// The entire bottom part of the sidebar.
const Info = Widget.Box({
  className: 'information',
  spacing: 12,
  vexpand: true,
  vertical: true,
  children: [
    Parent,
    Why,
    Dependencies,
  ]
})

export default Widget.Box({
  className: 'sidebar',
  vertical: true,
  widthRequest: 500,
  hexpand: false,
  children: [
    Top,
    Widget.Scrollable({
      child: Info,
    }),
  ]
})
