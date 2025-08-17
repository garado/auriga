/**
 * █░█ █ █▀ █░█ ▄▀█ █░░ █ ▀█ █▀▀ █▀█
 * ▀▄▀ █ ▄█ █▄█ █▀█ █▄▄ █ █▄ ██▄ █▀▄
 *
 * Music visualizer widget.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, astalify } from "astal/gtk4";
import AstalCava from "gi://AstalCava?version=0.1";

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Interpolate audio values to match the desired number of bars
 */
const interpolateValues = (values: number[], targetCount: number): number[] => {
  if (values.length === 0) return [];
  if (targetCount <= values.length) return values.slice(0, targetCount);

  const interpolated: number[] = [];
  for (let i = 0; i < targetCount; i++) {
    const valueIndex = (i / targetCount) * (values.length - 1);
    const lowerIndex = Math.floor(valueIndex);
    const upperIndex = Math.ceil(valueIndex);
    const fraction = valueIndex - lowerIndex;

    const interpolatedValue =
      values[lowerIndex] * (1 - fraction) +
      (values[upperIndex] || values[lowerIndex]) * fraction;
    interpolated.push(interpolatedValue);
  }
  return interpolated;
};

/*****************************************************************************
 * Draw functions
 *****************************************************************************/

/**
 * Mirrored and fully filled
 */
const symmetricFill = (self: VisualizerInterface, cr: any) => {
  const context = self.get_style_context();
  const h = self.get_allocated_height();
  const w = self.get_allocated_width();
  const fg = context.get_color();
  cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);

  const rawValues = self.cava?.get_values() || [];
  if (rawValues.length === 0) return;

  // Interpolate values to match bar count
  const values = interpolateValues(rawValues, self.bars);
  const centerY = h / 2;

  // Draw upper half (original behavior, but scaled to half height)
  let lastX = 0;
  let lastY = centerY - centerY * (values[0] / self.barHeight);
  cr.moveTo(lastX, lastY);

  for (let i = 1; i < values.length; i++) {
    const height = centerY * (values[i] / self.barHeight);
    let y = centerY - height; // Go up from center
    cr.curveTo(
      lastX + w / (self.bars - 1) / 2,
      lastY,
      lastX + w / (self.bars - 1) / 2,
      y,
      i * (w / (self.bars - 1)),
      y,
    );
    lastX = i * (w / (self.bars - 1));
    lastY = y;
  }

  // Complete the upper shape
  cr.lineTo(w, centerY);
  cr.lineTo(0, centerY);
  cr.fill();

  // Draw lower half (mirrored)
  lastX = 0;
  lastY = centerY + centerY * (values[0] / self.barHeight);
  cr.moveTo(lastX, lastY);

  for (let i = 1; i < values.length; i++) {
    const height = centerY * (values[i] / self.barHeight);
    let y = centerY + height; // Go down from center
    cr.curveTo(
      lastX + w / (self.bars - 1) / 2,
      lastY,
      lastX + w / (self.bars - 1) / 2,
      y,
      i * (w / (self.bars - 1)),
      y,
    );
    lastX = i * (w / (self.bars - 1));
    lastY = y;
  }

  // Complete the lower shape
  cr.lineTo(w, centerY);
  cr.lineTo(0, centerY);
  cr.fill();
};

/**
 * Mirrored and filled with dots
 */
const symmetricDots = (self: VisualizerInterface, cr: any) => {
  const context = self.get_style_context();
  const h = self.get_allocated_height();
  const w = self.get_allocated_width();
  const fg = context.get_color();
  const centerY = h / 2;
  const barWidth = w / self.bars;
  const dotSize = 3; // Radius of each dot
  const dotSpacing = 8; // Vertical spacing between dots
  const maxDots = Math.floor(h / 2 / dotSpacing); // Max dots per column

  const rawValues = self.cava?.get_values() || [];
  if (rawValues.length === 0) return;

  // Interpolate values to match bar count
  const values = interpolateValues(rawValues, self.bars);

  for (let i = 0; i < self.bars; i++) {
    const x = i * barWidth + barWidth / 2;
    const intensity = values[i] / self.barHeight;
    const numDots = Math.floor(intensity * maxDots);

    // Draw dots going up from center
    for (let dot = 0; dot < numDots; dot++) {
      const y = centerY - dot * dotSpacing;

      // Use fg color with fading alpha based on distance from center
      const alpha = fg.alpha * (0.9 - (dot / maxDots) * 0.4);
      cr.setSourceRGBA(fg.red, fg.green, fg.blue, alpha);

      // Draw the dot
      cr.arc(x, y, dotSize, 0, Math.PI * 2);
      cr.fill();
    }

    // Mirror dots going down from center
    for (let dot = 0; dot < numDots; dot++) {
      const y = centerY + (dot + 1) * dotSpacing;

      const alpha = fg.alpha * (0.9 - (dot / maxDots) * 0.4);
      cr.setSourceRGBA(fg.red, fg.green, fg.blue, alpha);

      cr.arc(x, y, dotSize, 0, Math.PI * 2);
      cr.fill();
    }
  }
};

/**
 * Just a line
 */
const symmetricLine = (self: VisualizerInterface, cr: any) => {
  const context = self.get_style_context();
  const h = self.get_allocated_height();
  const w = self.get_allocated_width();
  const fg = context.get_color();

  const rawValues = self.cava?.get_values() || [];
  if (rawValues.length === 0) return;

  // Interpolate values to match bar count for smoother line
  const values = interpolateValues(rawValues, self.bars);
  const centerY = h / 2;
  const amplitude = h / 3; // How far the wave can go up/down from center

  cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
  cr.setLineWidth(2);

  // Start the path
  for (let i = 0; i < values.length; i++) {
    const x = (i / (values.length - 1)) * w;

    // Convert audio value to oscillate around center
    // Since cava values are 0-barHeight, we need to make them oscillate
    const baseValue = values[i] / self.barHeight; // 0 to 1
    const oscillation = Math.sin(i * 0.3) * baseValue; // -baseValue to +baseValue
    const y = centerY + oscillation * amplitude;

    if (i === 0) {
      cr.moveTo(x, y);
    } else {
      cr.lineTo(x, y);
    }
  }

  cr.stroke();
};

/**
 * Mirrored and filled with rounded bars.
 */
const symmetricRoundedBars = (self: VisualizerInterface, cr: any) => {
  const context = self.get_style_context();
  const h = self.get_allocated_height();
  const w = self.get_allocated_width();
  const fg = context.get_color();
  const rawValues = self.cava?.get_values() || [];
  if (rawValues.length === 0) return;

  const values = interpolateValues(rawValues, self.bars);

  const centerY = h / 2;
  const barWidth = w / self.bars;
  const lineWidth = Math.max(2, barWidth * 0.6);
  const maxHeight = h / 2 - 10;

  cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
  cr.setLineWidth(lineWidth);
  cr.setLineCap(1);

  for (let i = 0; i < self.bars; i++) {
    const x = i * barWidth + barWidth / 2;
    const intensity = values[i] / self.barHeight;
    const barHeight = intensity * maxHeight;

    cr.moveTo(x, centerY - barHeight / 2);
    cr.lineTo(x, centerY + barHeight / 2);
    cr.stroke();
  }
};

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

interface VisualizerInterface extends Gtk.DrawingArea {
  barHeight: number;
  bars: number;
  smooth?: boolean;
  cava: AstalCava.Cava | null;
}

export enum VisualizerStyle {
  SYMMETRIC_FILL = "symmetric_fill",
  SYMMETRIC_DOTS = "symmetric_dots",
  SYMMETRIC_LINE = "symmetric_line",
  SYMMETRIC_BARS = "symmetric_bars",
}

const visualizerFunctions = {
  [VisualizerStyle.SYMMETRIC_FILL]: symmetricFill,
  [VisualizerStyle.SYMMETRIC_DOTS]: symmetricDots,
  [VisualizerStyle.SYMMETRIC_LINE]: symmetricLine,
  [VisualizerStyle.SYMMETRIC_BARS]: symmetricRoundedBars,
} as const;

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Visualizer = (props: {
  bars?: number;
  barHeight?: number;
  smooth?: boolean;
  style?: VisualizerStyle;
}) => {
  const DrawingArea = astalify(Gtk.DrawingArea);
  const cava = AstalCava.get_default();
  const bars = props.bars ? props.bars : 20;
  const barHeight = props.barHeight ? props.barHeight : 100;
  const style = props.style ? props.style : VisualizerStyle.SYMMETRIC_FILL;

  return DrawingArea({
    vexpand: true,
    hexpand: true,
    cssClasses: ["visualizer"],
    setup: (self) => {
      (self as VisualizerInterface).barHeight = barHeight;
      (self as VisualizerInterface).bars = bars;
      (self as VisualizerInterface).cava = cava;

      self.set_draw_func(visualizerFunctions[style]);

      const signalId = cava?.connect("notify::values", () => {
        self.queue_draw();
      });

      self.connect("destroy", () => {
        if (signalId && cava) {
          cava.disconnect(signalId);
        }
      });
    },
  });
};
