/**
 * █▀█ █▀ █▀   █▀▀ █▀▀ █▀▀ █▀▄
 * █▀▄ ▄█ ▄█   █▀░ ██▄ ██▄ █▄▀
 *
 * RSS feed widget.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { AstalIO, bind, timeout, Variable } from "astal";
import Pango from "gi://Pango?version=1.0";
import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";

import TTRSS, { Headline } from "@/services/Rss";
import { epochToRelativeTime } from "@/utils/Time";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let ttrss: InstanceType<typeof TTRSS> | undefined = undefined;

const Scrollable = astalify(Gtk.ScrolledWindow);

const HOVER_REVEAL_EXCERPT_TIMEOUT = 1000;

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
 * Widget definition
 *****************************************************************************/

const FeedItem = (headline: Headline) => {
  const isHovered = Variable(false);
  let hoverTimeout: AstalIO.Time | null = null;

  const ArticleTitle = Widget.Label({
    cssClasses: [CSS_CLASSES.HEADLINE_TITLE],
    label: headline.title,
    hexpand: true,
    ellipsize: Pango.EllipsizeMode.END,
    wrap: true,
    lines: 2,
    xalign: 0,
  });

  const ArticleExcerpt = Widget.Label({
    cssClasses: [CSS_CLASSES.HEADLINE_EXCERPT],
    xalign: 0,
    label: headline.excerpt,
    lines: bind(isHovered).as((hover) => (hover ? 5 : 2)),
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
    children: [ArticleTitle, SourceTitleAndTime, ArticleExcerpt],
    onHoverEnter: () => {
      hoverTimeout = timeout(HOVER_REVEAL_EXCERPT_TIMEOUT, () => {
        isHovered.set(true);
      });
    },
    onHoverLeave: () => {
      hoverTimeout?.cancel();
      hoverTimeout = null;
      isHovered.set(false);
    },
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
        label: "RSS",
      }),
    ],
  });

export const Rss = () => {
  ttrss = TTRSS.get_default();
  ttrss.fetchHeadlines(20);

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
