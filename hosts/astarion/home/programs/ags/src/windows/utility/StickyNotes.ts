/**
 * █▀ ▀█▀ █ █▀▀ █▄▀ █▄█   █▄░█ █▀█ ▀█▀ █▀▀ █▀
 * ▄█ ░█░ █ █▄▄ █░█ ░█░   █░▀█ █▄█ ░█░ ██▄ ▄█
 *
 * Simple sticky notes utility widget, like on macos.
 * Text only for now.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Astal, Gdk, Gtk, Widget } from "astal/gtk4";

import SettingsManager from "@/services/settings";
import { clearChildren } from "@/utils/BoxUtils";
import { convertMarkdownToPangoMarkup } from "@/utils/MarkdownToMarkup";
import { readAllFilesFromDir } from "@/utils/File";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const settings = SettingsManager.get_default();
const notesPath = settings.config.utility.stickyNotesPath;

let stickyNotesContainer: Astal.Box | undefined = undefined;

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  placeholder: "placeholder",
  entireWidget: "sticky-notes", // Container holding the entire widget
  stickyNotesContainer: "sticky-notes-container", // Container holding all sticky notes
  stickyNoteContainer: "sticky-note", // An individual sticky note
  stickyNoteTitle: "title",
  stickyNoteContent: "content",
  reloadButton: "reload-button",
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Load sticky notes from the user-specified stickyNotesPath directory and populate
 * the stickyNotesContainer widget.
 */
const loadStickies = () => {
  const stickies = readAllFilesFromDir(notesPath);
  clearChildren(stickyNotesContainer!);

  if (Object.keys(stickies).length) {
    for (const [filename, content] of Object.entries(stickies)) {
      stickyNotesContainer!.append(StickyNote(filename, content));
    }
  } else {
    stickyNotesContainer!.append(Placeholder());
  }
};

/*****************************************************************************
 * Widgets
 *****************************************************************************/

/**
 * Widget displaying a sticky note.
 */
const StickyNote = (noteName: string, noteText: string) => {
  return Widget.Box({
    cssClasses: [CSS_CLASSES.stickyNoteContainer],
    vertical: true,
    hexpand: true,
    children: [
      Widget.Label({
        label: noteName,
        cssClasses: [CSS_CLASSES.stickyNoteTitle],
        selectable: false,
        xalign: 0,
        wrap: true,
        useMarkup: true,
      }),
      Widget.Label({
        label: convertMarkdownToPangoMarkup(noteText.trim()),
        cssClasses: [CSS_CLASSES.stickyNoteContent],
        selectable: true,
        xalign: 0,
        wrap: true,
        useMarkup: true,
      }),
    ],
  });
};

/**
 * Placeholder widget for if there are no sticky notes or if the sticky note path
 * is not configured.
 */
const Placeholder = () => {
  let label = "";

  if (settings.config.utility.stickyNotesPath == "") {
    label = "No sticky notes directory configured.\nUpdate your user settings.";
  } else {
    label = "No sticky notes added yet.";
  }

  return Widget.Label({
    label: label,
    cssClasses: [CSS_CLASSES.placeholder],
    halign: Gtk.Align.FILL,
    valign: Gtk.Align.FILL,
    hexpand: true,
    vexpand: true,
    justify: Gtk.Justification.CENTER,
  });
};

/**
 * Button to reload sticky notes.
 */
const ReloadContentButton = () => {
  return Widget.Button({
    canFocus: false,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    cssClasses: [CSS_CLASSES.reloadButton],
    hexpand: true,
    halign: Gtk.Align.CENTER,
    child: Widget.Box({
      vertical: false,
      spacing: 8,
      children: [
        Widget.Image({
          iconName: "arrows-clockwise-symbolic",
        }),
        Widget.Label({
          label: "Reload notes",
        }),
      ],
    }),
    onClicked: loadStickies,
  });
};

/**
 * Container for all sticky notes.
 */
export const StickyNotes = () => {
  stickyNotesContainer = Widget.Box({
    vertical: true,
    cssClasses: [CSS_CLASSES.stickyNotesContainer],
    spacing: 20,
  });

  loadStickies();

  return Widget.Box({
    name: "StickyNotesTab",
    cssClasses: [CSS_CLASSES.entireWidget],
    vexpand: true,
    hexpand: true,
    vertical: true,
    children: [
      Widget.Box({
        children: [ReloadContentButton()],
      }),
      stickyNotesContainer,
    ],
  });
};
