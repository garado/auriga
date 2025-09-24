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

import { CustomSourceView } from "@/components/CustomSourceView";
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
  placeholder: "placeholder-text",
  stickyNotesContainer: "sticky-notes", // For all sticky notes
  stickyNoteContainer: "sticky-note", // For individual sticky note
  stickyNoteTitle: "title",
  stickyNoteContent: "content",
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

  if (Object.keys(stickies).length) {
    clearChildren(stickyNotesContainer!);
    for (const [filename, content] of Object.entries(stickies)) {
      stickyNotesContainer!.append(StickyNote(filename, content));
    }
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
        label: convertMarkdownToPangoMarkup(noteText),
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
    label = "No sticky notes added yet!";
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
 * Container for all sticky notes.
 */
export const StickyNotes = () => {
  stickyNotesContainer = Widget.Box({
    cssClasses: [CSS_CLASSES.stickyNotesContainer],
    children: [Placeholder()],
  });

  if (notesPath !== "") {
    loadStickies();
  }

  return stickyNotesContainer;
};
