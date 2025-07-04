
// ▄▀█ █▀█ █▀█   █░░ ▄▀█ █░█ █▄░█ █▀▀ █░█ █▀▀ █▀█
// █▀█ █▀▀ █▀▀   █▄▄ █▀█ █▄█ █░▀█ █▄▄ █▀█ ██▄ █▀▄

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import App from 'resource:///com/github/Aylur/ags/app.js'
import Gdk from "gi://Gdk";

const { query } = await Service.import('applications');

const WINDOW_NAME = 'notrofi'

// A single entry in the app launcher
const AppItem = app => Widget.Button({
  onClicked: () => {
    App.closeWindow(WINDOW_NAME);
    app.launch();
  },
  attribute: { app },
  child: Widget.Box({
    children: [
      Widget.Label({
        class_name: 'title',
        label: app.name,
        hpack: 'start',
        vpack: 'center',
        truncate: 'end',
      }),
    ],
  }),
});


export default (width = 500, height = 500, spacing = 12 ) => {
  // list of application buttons
  let applications = query('').map(AppItem);

  // container holding the buttons
  const list = Widget.Box({
    vertical: true,
    className: 'appcontainer',
    children: applications,
    spacing,
  });

  // repopulate the box, so the most frequent apps are on top of the list
  function repopulate() {
    applications = query('').map(AppItem);
    list.children = applications;
  }

  // search entry
  const entry = Widget.Entry({
    hexpand: true,
    css: `margin-bottom: ${spacing}px;`,

    // to launch the first item on Enter
    on_accept: () => {
      if (applications[0]) {
        App.closeWindow(WINDOW_NAME);
        applications[0].attribute.app.launch();
      }
    },

    // filter out the list
    on_change: ({ text }) => applications.forEach(item => {
      item.visible = item.attribute.app.match(text ?? '');
    }),
  });

  return Widget.Box({
    vertical: true,
    css: `margin: ${spacing * 2}px;`,
    attribute: entry, // expose entry
    children: [
      entry,

      // wrap the list in a scrollable
      Widget.Scrollable({
        hscroll: 'never',
        css: `
          min-width: ${width}px;
          min-height: ${height}px;
          `,
        child: list,
      }),
    ],
    setup: self => self.hook(App, (_, windowName, visible) => {
      if (windowName !== WINDOW_NAME)
      return;

      // when the applauncher shows up
      if (visible) {
        repopulate();
        entry.text = '';
        entry.grab_focus();
      }
    }),
  });
};
