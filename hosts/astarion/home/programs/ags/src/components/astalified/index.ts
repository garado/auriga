/**
 * ▄▀█ █▀ ▀█▀ ▄▀█ █░░ █ █▀▀ █ █▀▀ █▀▄
 * █▀█ ▄█ ░█░ █▀█ █▄▄ █ █▀░ █ ██▄ █▄▀
 *
 * Default GTK widgets, but they're fully declarative.
 */

import FrameFactory from "./Frame";
import FlowBoxFactory from "./FlowBox";
import CenterBoxFactory from "./CenterBox";
import ScrolledWindowFactory from "./ScrolledWindow";

export const Astalified = {
  Frame: FrameFactory,
  FlowBox: FlowBoxFactory,
  CenterBox: CenterBoxFactory,
  ScrolledWindow: ScrolledWindowFactory,
};

export default Astalified;
