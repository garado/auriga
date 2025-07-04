
// █▀▀ █▀█ ▄▀█ █░░   █▄▄ █▀█ ▀▄▀
// █▄█ █▄█ █▀█ █▄▄   █▄█ █▄█ █░█

// The main informational widgets displayed on the goals tab.
// Only created for top-level nodes, i.e. nodes that have no parent.

import Gdk from 'gi://Gdk'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import GoalService from '../../services/goals.js'

const GroupColors = {
  career:         'accent-1',
  financial:      'accent-2',
  health:         'accent-3',
  personal:       'accent-4',
  relationships:  'accent-5',
  travel:         'accent-6',
  _bigpicture:    'accent-7',
}

/**
 * Widget containing information about goal.
 * Clicking reveals more goal information in the sidebar.
 */
function CreateGoal(data, isBigPicture) {
  /* ... title */
  const title = Widget.Label({
    className: isBigPicture ? 'big-picture-title' : 'title',
    vpack: 'start',
    xalign: 0,
    wrap: true,
    label: data.status == 'completed' || data.status == 'failed' ? `<s>${data.description}</s>`: data.description,
    useMarkup: true,
  })

  /* Status badge only shown for completed/failed tasks */
  const status = Widget.Label({
    className: data.status,
    label: data.status.charAt(0).toUpperCase() + data.status.slice(1),
    hpack: 'start',
  })

  /* For top-level nodes with subnodes: this shows the currently active node.
   * 'Currently active' == marked as 'Started' in Taskwarrior 
   * If there are multiple things marked 'Started' - there shouldn't be, but it will 
   * take the first one it finds */
  
  let pinned = null
  const firstPinnedSubnode = data.children.find(x => x.start)

  if (firstPinnedSubnode) {
    pinned = Widget.Box({
      className: 'pinned',
      spacing: 2,
      children: [
        Widget.Icon({
          icon: 'caret-right-symbolic',
          css: 'margin-top: 2px',
        }),
        Widget.Label({
          wrap: true,
          xalign: 0,
          label: firstPinnedSubnode.description,
        }),
      ]
    })
  }

  /* Due date */
  const targetDate = Widget.Box({
    className: 'due',
    spacing: 4,
    setup: self => {
      if (!data.due) return
      self.children = [
        Widget.Icon({
          vpack: 'end',
          css: 'margin-bottom: 2px', /* icons don't naturally align, so... */
          icon: 'clock-symbolic',
        }),
        Widget.Label({
          vpack: 'end',
          label: GoalService.tasktimeToYYYYMMDD(data.due)
        }),
      ]
    }
  })

  /* Completion */
  const progress = Widget.Box({
    className: 'progress',
    hpack: 'end',
    spacing: 4,
    setup: self => {
      const total = data.children.length
      if (total == 0) return

      // Count completed subgoals
      const completed = data.children.filter(x => x.status == 'completed').length

      self.children = [
        Widget.Icon({
          vpack: 'end',
          css: 'margin-bottom: 2px', /* icons don't naturally align, so... */
          icon: 'check-circle-symbolic',
        }),
        Widget.Label({
          vpack: 'end',
          label: `${completed}/${total}`,
        }),
      ]
    }
  })

  /* Assemble the widgets above */
  const goal = Widget.CenterBox({
    className: 'interior',
    vertical: true,
    heightRequest: isBigPicture ? 350 : 200,
    widthRequest: isBigPicture ? 520 : 320,
    startWidget: Widget.Box({
      className: 'top',
      vertical: true,
      vpack: 'start',
      spacing: 6,
      children: [
        title,
        pinned,
        (data.status == 'pending' ? null : status),
      ]
    }),
    endWidget: Widget.CenterBox({
      className: 'bottom',
      startWidget: targetDate,
      endWidget: progress,
    })
  })

  /* Stack info on top of image */
  const stack = Widget.Overlay({
    child: Widget.Box({
      heightRequest: isBigPicture ? 350 : 200,
      widthRequest: isBigPicture ? 520 : 320,
      classNames: ['imagebox', GroupColors[data.project]],
      css: `background-image: url('${data.imgpath}')`,
    }),
    overlays: [
      goal
    ],
  })

  return Widget.EventBox({
    classNames: ['goalbox', data.status],
    canFocus: true,
    child: stack,

    onPrimaryClick: () => {
      if (data.uuid != GoalService.sidebar_data.uuid) {
        GoalService.sidebar_breadcrumbs = []
        GoalService.sidebar_data = data
        GoalService.requestSidebar(true)
      }
    },

    setup: self => {
      self.connect('key-press-event', (self, event) => {
        const key = event.get_keyval()[1]

        /* Pressing ENTER should open the sidebar */
        if (Gdk.KEY_Return == key) {
          self.onPrimaryClick()
          return true
        }

        /* Copy shortened UUID to clipboard */
        if (Gdk.KEY_y == key) {
          /* Without 2>/dev/null, stderr will not close before forking, so app will hang */
          Utils.exec(`bash -c "wl-copy ${data.uuid.slice(0, 8)} 2>/dev/null"`);
          return true
        }
      })
    }
  })
}

export default CreateGoal

