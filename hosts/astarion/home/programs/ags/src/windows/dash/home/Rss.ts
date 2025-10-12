/**
 * █▀█ █▀ █▀   █▀▀ █▀▀ █▀▀ █▀▄
 * █▀▄ ▄█ ▄█   █▀░ ██▄ ██▄ █▄▀
 *
 * RSS feed widget.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import TTRSS, { Headline } from "@/services/Rss";
import { bind, Gio, Variable } from "astal";
import Pango from "gi://Pango?version=1.0";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import { epochToRelativeTime } from "@/utils/Time";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let ttrss: InstanceType<typeof TTRSS> | undefined = undefined;

const Scrollable = astalify(Gtk.ScrolledWindow);

const CSS_CLASSES = {
  CONTAINER: "rss-feed",
  LINK_BUTTON: "link-btn",
  WIDGET_HEADER: "header",
  HEADLINE: "headline",
  HEADLINE_TITLE: "headline-title",
  HEADLINE_EXCERPT: "headline-excerpt",
  HEADLINE_FEED_TITLE: "headline-feed-title",
};

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

async function loadImageFromUrl(url: string): Promise<Gtk.Picture> {
  print(url);
  if (url === undefined) return;

  const picture = new Gtk.Picture();

  return new Promise((resolve, reject) => {
    const file = Gio.File.new_for_uri(url);

    file.load_contents_async(null, (file, res) => {
      try {
        const [, contents] = file.load_contents_finish(res);

        const stream = Gio.MemoryInputStream.new_from_bytes(contents);
        const pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
        const texture = Gdk.Texture.new_for_pixbuf(pixbuf);

        picture.set_paintable(texture);
        resolve(picture);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

const FeedItem = (headline: Headline) => {
  const ArticleTitle = Widget.Label({
    cssClasses: [CSS_CLASSES.HEADLINE_TITLE],
    label: headline.title,
    hexpand: true,
    ellipsize: Pango.EllipsizeMode.END,
    wrap: true,
    lines: 2,
    xalign: 0,
  });

  const ArticleExcept = Widget.Label({
    cssClasses: [CSS_CLASSES.HEADLINE_EXCERPT],
    xalign: 0,
    label: headline.excerpt,
    lines: 2,
    ellipsize: Pango.EllipsizeMode.END,
    wrap: true,
    visible: headline.excerpt != "",
  });

  const SourceTitleAndTime = Widget.Label({
    cssClasses: [CSS_CLASSES.HEADLINE_FEED_TITLE],
    hexpand: true,
    ellipsize: Pango.EllipsizeMode.END,
    xalign: 0,
    label: `${headline.feed_title} - ${epochToRelativeTime(headline.updated)}`,
  });

  return Widget.Box({
    cssClasses: [CSS_CLASSES.HEADLINE],
    vertical: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    children: [ArticleTitle, SourceTitleAndTime, ArticleExcept],
    onButtonPressed: () => {
      Gtk.show_uri(null, headline.link, Gdk.CURRENT_TIME);
    },
  });
};

const WidgetHeader = () =>
  Widget.Box({
    cssClasses: [CSS_CLASSES.WIDGET_HEADER],
    spacing: 8,
    vertical: false,
    hexpand: true,
    halign: Gtk.Align.CENTER,
    children: [
      Widget.Image({
        iconName: "rss-symbolic",
      }),
      Widget.Label({
        label: "RSS Feed",
      }),
    ],
  });

export const Rss = () => {
  ttrss = TTRSS.get_default();
  ttrss.fetchHeadlines(10);

  const HeadlineContainer = Widget.Box({
    vertical: true,
    spacing: 8,
    children: bind(ttrss, "headlines").as((headlines) =>
      headlines.map(FeedItem),
    ),
  });

  const widget = Scrollable({
    hexpand: true,
    vexpand: true,
    setup: (self) => {
      self.hscrollbar_policy = Gtk.PolicyType.NEVER;
      self.vscrollbar_policy = Gtk.PolicyType.ALWAYS;
      self.set_child(HeadlineContainer);
    },
  });

  return Widget.Box({
    vertical: true,
    cssClasses: [CSS_CLASSES.CONTAINER, "widget-container"],
    children: [WidgetHeader(), widget],
  });
};
