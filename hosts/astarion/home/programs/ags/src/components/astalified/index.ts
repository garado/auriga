/**
 * ▄▀█ █▀ ▀█▀ ▄▀█ █░░ █ █▀▀ █ █▀▀ █▀▄
 * █▀█ ▄█ ░█░ █▀█ █▄▄ █ █▀░ █ ██▄ █▄▀
 *
 * Default GTK widgets, but they're fully declarative.
 */

import FrameFactory from "./Frame";
import FlowBoxFactory from "./FlowBox";
import CenterBoxFactory from "./CenterBox";

export const Astalified = {
  Frame: FrameFactory,
  FlowBox: FlowBoxFactory,
  CenterBox: CenterBoxFactory,
};

export default Astalified;
