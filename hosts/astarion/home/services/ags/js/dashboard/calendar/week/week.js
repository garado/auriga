
// █░█░█ █▀▀ █▀▀ █▄▀   █░█ █ █▀▀ █░█░█
// ▀▄▀▄▀ ██▄ ██▄ █░█   ▀▄▀ █ ██▄ ▀▄▀▄▀

// Google Calendar-esque calendar view.

// This code is dogshit

import Gtk from 'gi://Gtk'
import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import CalSvc from '../../../services/gcalcli.js'

import EventBox from './_eventbox.js'
import UserConfig from '../../../../userconfig.js'

const Fixed = Widget.subclass(Gtk.Fixed)

/*********************************************
 * HELPER FUNCTIONS (Shoutout StackOverflow)
 *********************************************/

function determinePlacement(dateString, eventIndex) {
  const bubbles = []
}

/**
 * Returns true if events A and B collide.
 * Note: FH stands for 'float hour'
 * It is a way to represent the time of day as a float, where every 
 * whole number represents one full hour.
 *
 * Time         Equivalent FH
 * -----        -------------
 * 12AM     ->  0.0
 * 9:15AM   ->  9.25
 * 5:30PM   ->  17.5
 * 11:59PM  ->  23.983333333
 *    
 **/
function collidesWith(a, b) {
  return a.endFH > b.startFH && a.startFH < b.endFH
}


function isWithin(a, b) {
  return a.startFH > b.startFH && a.endFH < b.endFH
}

function drawFullWidthDespiteOverlap(a, b) {
}

/*****************************************
 * WIDGETS
 *****************************************/

const multiDayGridLines = Widget.DrawingArea({
  heightRequest:  CalSvc.MULTIDAY_HEIGHT_PX,
  widthRequest: ((CalSvc.DAY_WIDTH_PX + CalSvc.WIDGET_SPACING) * 7),
  className: 'weekview-gridlines',

  drawFn: (self, cr, w, h) => {
    /* Get the color used for the weekview-gridlines class */
    const styles = self.get_style_context();
    const fg = styles.get_color(Gtk.StateFlags.NORMAL);
    cr.setSourceRGBA(fg.red, fg.green, fg.blue, 1)

    /* Draw horizontal line at bottom */
    let y = CalSvc.MULTIDAY_HEIGHT_PX
    cr.moveTo(CalSvc.HOURLABEL_WIDTH_PX, y)
    cr.lineTo(CalSvc.VIEWPORT_WIDTH_PX, y)
    
    /* Draw vertical lines to separate days */
    let x = CalSvc.HOURLABEL_OVERHANG_PX + CalSvc.HOURLABEL_WIDTH_PX
    cr.moveTo(x, 0)
    for (let i = 0; i < 7; i++) {
      cr.lineTo(x, CalSvc.HOUR_HEIGHT_PX * 24)
      x += CalSvc.DAY_WIDTH_PX + CalSvc.WIDGET_SPACING_PX
      cr.moveTo(x, 0)
    }
    
    cr.stroke()
  }
})

/**
 * The gridLines underneath the day columns.
 */
const gridLines = Widget.DrawingArea({
  heightRequest:  CalSvc.HOUR_HEIGHT_PX * 24,
  widthRequest: ((CalSvc.DAY_WIDTH_PX + CalSvc.WIDGET_SPACING) * 7) + CalSvc.HOURLABEL_OVERHANG_PX,
  className: 'weekview-gridlines',

  drawFn: (self, cr, w, h) => {
    /* Get the color used for the weekview-gridlines class */
    const styles = self.get_style_context();
    const fg = styles.get_color(Gtk.StateFlags.NORMAL);
    cr.setSourceRGBA(fg.red, fg.green, fg.blue, 1)

    /* Draw horizontal lines to separate hours */
    let y = 0
    cr.moveTo(0, y)
    for (let _ = 0 ; _ < 24; _++) {
      cr.lineTo(CalSvc.VIEWPORT_WIDTH_PX, y)
      y += CalSvc.HOUR_HEIGHT_PX
      cr.moveTo(0, y)
    }

    /* Draw vertical lines to separate days */
    let x = CalSvc.HOURLABEL_OVERHANG_PX
    cr.moveTo(x, 0)
    for (let i = 0; i < 7; i++) {
      cr.lineTo(x, CalSvc.HOUR_HEIGHT_PX * 24)
      x += CalSvc.DAY_WIDTH_PX + CalSvc.WIDGET_SPACING_PX
      cr.moveTo(x, 0)
    }
    
    cr.stroke()
  }
})

/**
 * The labels to the left that show the hour.
 */
const hourLabels = Widget.Box({
  vertical: true,
  heightRequest: CalSvc.HOUR_HEIGHT_PX * 24,
  widthRequest: CalSvc.HOURLABEL_WIDTH_PX,

  setup: self => {
    for (let i = 0; i < 24; i++) {
      const hourLabel = Widget.Label({
        // im doing some fuckery here to align it with the hour gridLines
        // uncomment below to reveal the fuckery
        // css: `background-color: ${i % 2 ? 'red' : 'blue'}`,
        hpack: 'end',
        vpack: 'end',
        label: i == 0 ? '' : `${i < 10 ? '0' : ''}${i}:00  `, /* ew lol */
        heightRequest: i == 0 ? CalSvc.HOUR_HEIGHT_PX / 2 : CalSvc.HOUR_HEIGHT_PX,
        widthRequest: CalSvc.HOURLABEL_WIDTH_PX,
        className: 'hour-label',
      })
      self.add(hourLabel)
    }
  }
})

/**
 * The labels above every day column indicating the day and weekday.
 */
const dateLabels = Widget.Box({
  spacing: CalSvc.WIDGET_SPACING_PX,
  css: `margin-left: ${CalSvc.HOURLABEL_OVERHANG_PX}px`,

  setup: self => {

    self.add(Widget.Box({
      visible: true,
      widthRequest: CalSvc.HOURLABEL_WIDTH_PX,
    }))

    for (let i = 0; i < 7; i++) {
      const name = Widget.Label({
        className: 'day-name',
        label: `${CalSvc.DAY_NAMES[i]}`
      })

      const number = Widget.Label({
        className: 'number',
      })

      const dateLabel = Widget.Box({
        classNames: [
          'date-label',
          CalSvc.viewrange[i] == CalSvc.today ? 'active' : '',
        ],
        widthRequest: CalSvc.DAY_WIDTH_PX,
        attribute: number,
        vertical: true,
        children: [
          name,
          number,
        ]
      })

      self.add(dateLabel)
    }
  }
})

/**
 * When the viewrange is changed, edit date labels to reflect the new viewrange.
 */
dateLabels.hook(CalSvc, (self, viewrange) => {
  if (viewrange == undefined) return

  for (let i = 0; i < viewrange.length; i++) {
    const newLabel = /-(\d\d)$/.exec(CalSvc.viewrange[i])[1]
    self.children[i + 1].attribute.label = newLabel
    self.children[i + 1].classNames = [
      'date-label',
      CalSvc.viewrange[i] == CalSvc.today ? 'active' : '',
    ]
  }
}, 'viewrange-changed')

/**
 * Widget showing multi-day events for the week.
 */
const multiDayContainer = Fixed({
  className: 'multiday',
  widthRequest: CalSvc.DAY_WIDTH_PX * 7,
  heightRequest: CalSvc.MULTIDAY_HEIGHT_PX,
  setup: self => self.hook(CalSvc, (self, viewrange, viewdata) => {
    if (viewrange == undefined && viewdata == undefined) return
    
    /* Clear any old events */
    self.get_children().forEach(event => {
      event.foreach(x => event.remove(x))
      self.remove(event)
    })

    let multiDayEvents = []
    Object.values(viewdata).forEach(arr => {
      multiDayEvents.push(...(arr.filter(event => event.multiDay || event.allDay)))
    })

    multiDayEvents.forEach(event => {self.addMultiDayEvent(event)})

    /* Make this widget smaller if there's no multiday events */
    if (multiDayEvents.length == 0) {
      self.heightRequest = 10
    }

  }, 'viewrange-changed')
})

Object.assign(multiDayContainer, {
  addMultiDayEvent: (event) => {
    /* Adjust color based on which calendar */
    let bgcolor = ''
    if (UserConfig.calendar.colors[event.calendar]) {
      bgcolor = UserConfig.calendar.colors[event.calendar]
    }

    let xPos = CalSvc.HOURLABEL_OVERHANG_PX + CalSvc.HOURLABEL_WIDTH_PX
    if (!event.startedBeforeThisWeek) {
      xPos += CalSvc.viewrange.indexOf(event.startDate) * (CalSvc.DAY_WIDTH_PX + CalSvc.WIDGET_SPACING_PX)
    }

    let daySpan
    if (!event.allDay && event.multiDay) {
      daySpan = CalSvc.viewrange.indexOf(event.endDate) - CalSvc.viewrange.indexOf(event.startDate) + 1
    } else if (event.startedBeforeThisWeek && event.endsAfterThisWeek) {
      daySpan = 7
    } else if (!event.startedBeforeThisWeek && !event.endsAfterThisWeek) {
      daySpan = CalSvc.viewrange.indexOf(event.endDate) - CalSvc.viewrange.indexOf(event.startDate)
    } else if (event.startedBeforeThisWeek && !event.endsAfterThisWeek) {
      daySpan = CalSvc.viewrange.indexOf(event.endDate)
    } else if (!event.startedBeforeThisWeek && event.endsAfterThisWeek) {
      daySpan = 7 - CalSvc.viewrange.indexOf(event.startDate)
    }

    const eventWidget = Widget.Box({
      className: 'multiday-event-widget',
      css: `${bgcolor != '' ? `background-color: ${bgcolor}`: ''}`,
      heightRequest: CalSvc.MULTIDAY_HEIGHT_PX - 8,
      widthRequest: daySpan * (CalSvc.DAY_WIDTH_PX + CalSvc.WIDGET_SPACING_PX) - CalSvc.EVENTBOX_RIGHT_MARGIN,
      canFocus: true,
      children: [
        event.startedBeforeThisWeek ? Widget.Icon('arrow-left-symbolic') : null,
        Widget.Label({
          xalign: 0,
          wrap: false,
          useMarkup: true,
          truncate: 'end',
          label: event.description
        }),
        !event.allDay ? Widget.Label(`, ${event.startTime}`) : null,
        event.endsAfterThisWeek ? Widget.Icon('arrow-right-symbolic') : null,
      ],
    })

    multiDayContainer.put(eventWidget, xPos, 0)
  }
})

/**
 * Widget containing columns for the entire week.
 **/
const dayColumns = Widget.Box({
  name: 'dash-cal-daycolumns',
  vexpand: false,
  spacing: CalSvc.WIDGET_SPACING_PX,
  heightRequest: CalSvc.HOUR_HEIGHT_PX * 24,
  widthRequest: CalSvc.DAY_WIDTH_PX * 7,
  children: [],

  setup: self => self.hook(CalSvc, (self, viewrange, viewdata) => {
    if (viewrange === undefined && viewdata === undefined) return

    /* On first invocation ---------------------------------- */
    if (self.children.length == 0) {
      for (let i = 0; i < 7; i++) {
        const dayColumn = Fixed({
          heightRequest: CalSvc.HOUR_HEIGHT_PX * 24,
          widthRequest: CalSvc.DAY_WIDTH_PX,
          visible: true, // needs to be forced,
        })

        self.add(dayColumn)
      }
    }

    /* After first invocation -------------------------------- */
    for (let index = 0; index < viewrange.length; index++) {
      /* Helper function for drawing events */
      function packEvents(group) {
        for (let i = 0; i < group.length; i++) {
          /* Drawing multi-day events will be handled elsewhere. */
          if (group[i].multiDay || group[i].allDay) continue

          const xPos = (i / group.length) * (CalSvc.DAY_WIDTH_PX / group.length) + CalSvc.HOURLABEL_OVERHANG_PX
          const yPos = group[i].startFH * CalSvc.HOUR_HEIGHT_PX

          const eBox = EventBox(group[i])
          eBox.widthRequest = CalSvc.DAY_WIDTH_PX - xPos

          self.children[index].put(eBox, xPos, yPos)
        }
      }

      const thisDayColumn = self.children[index]

      /* Clear old events */
      thisDayColumn.get_children().forEach(element => {
        element.foreach(x => element.remove(x))
        thisDayColumn.remove(element)
      });

      /* Now draw all events */
      const events = viewdata[viewrange[index]]
      let group = []
      let lastGroupEventEnd = null
      let placed = false

      events.forEach(currEvent => {

        if (currEvent.startFH >= lastGroupEventEnd) {
          packEvents(group)
          group = []
          lastGroupEventEnd = null
        }

        placed = false

        for (let i = 0; i < group.length; i++) {
          if (collidesWith(group[i], currEvent)) {
            group.push(currEvent)
            placed = true
            break
          }
        }

        if (!placed) {
          packEvents(group)
          group = []
          group.push(currEvent)
        }

        if (lastGroupEventEnd == null || currEvent.endFH > lastGroupEventEnd) {
          lastGroupEventEnd = currEvent.endFH
        }
      });

      if (group.length > 0) {
        packEvents(group)
      }
    }
  }, 'viewrange-changed')
})

const content = Widget.Scrollable({
  className: 'scroll',
  vscroll: 'always',
  hscroll: 'never',
  hexpand: true,
  overlayScrolling: false, // makes scrollbar always visible
  heightRequest: CalSvc.HOUR_HEIGHT_PX * CalSvc.HOURS_VIEWABLE,
  child: Widget.Box({
    vertical: false,
    children: [
      hourLabels,
      Widget.Overlay({
        child: gridLines,
        widthRequest: (CalSvc.DAY_WIDTH_PX * 7) + 40, /* @TODO no idea why i need to add 40 */
        overlays: [Widget.Box({
          vertical: false,
          children: [
            dayColumns
          ],
        })],
      })
    ]
  }),

  setup: self => {
    /* Set initial scroll position, but only once, at app startup. 
     * @TODO reinit scroll position whenever we switch to the tab */
    let handler
    const setScrollbarInitialPos = (self) => {
      const initialPosition = (CalSvc.HOUR_HEIGHT_PX * 8) - 20
      self.vadjustment.set_value(initialPosition)
      self.disconnect(handler)
    }
    handler = self.connect('size-allocate', setScrollbarInitialPos)

    /* Jump to top/bottom */
    self.hook(CalSvc, (self, dir) => {
      if (dir == undefined) return

      /* 1 == top, -1 == bottom */
      const newVal = dir == 1 ? 0 : self.vadjustment.upper
      self.vadjustment.set_value(newVal)
    }, 'weekview-jump')

    /* Scroll up/down */
    self.hook(CalSvc, (self, dir) => {
      if (dir == undefined) return

      /* 1 == up, -1 == down */
      const step = self.vadjustment.step_increment * 2

      let newVal = self.vadjustment.value += (step * dir)

      if (newVal < 0) {
        newVal = 0
      } else if (newVal > self.vadjustment.upper) {
        newVal = self.vadjustment.upper
      }

      self.vadjustment.set_value(newVal)
    }, 'weekview-scroll')
  }
})

export default () => Widget.Box({
  name: 'week',
  className: 'week',
  hpack: 'center',
  vpack: 'center',
  vertical: true,
  vexpand: false,
  hexpand: false,
  attribute: { name: 'Week' },
  children: [
    dateLabels,
    Widget.Overlay({
      child: multiDayGridLines,
      widthRequest: (CalSvc.DAY_WIDTH_PX * 7),
      overlays: [Widget.Box({
        vertical: false,
        children: [
          multiDayContainer
        ],
      })],
    }),
    content,
  ]
})
