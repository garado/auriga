/**
 * █▀▄▀█ █▀█ █▄░█ █ ▀█▀ █▀█ █▀█   ▄▀█ █▀█ █▀█ ▄▀█ █▄░█ █▀▀ █▀▀ █▀▄▀█ █▀▀ █▄░█ ▀█▀
 * █░▀░█ █▄█ █░▀█ █ ░█░ █▄█ █▀▄   █▀█ █▀▄ █▀▄ █▀█ █░▀█ █▄█ ██▄ █░▀░█ ██▄ █░▀█ ░█░
 *
 * Monitor positioning system with collision detection
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Gdk, Widget } from "astal/gtk4";

import { DraggableBox, DraggableBoxClass } from "@/components/Draggable";
import { execAsync, register } from "astal";

/*****************************************************************************
 * Classes
 *****************************************************************************/

const CSS_CLASSES = {
  ARRANGEMENT: "monitor-arrangement",
  CANVAS: "monitor-canvas",
  MONITOR: "monitor-item",
  MONITOR_LABEL: "monitor-label",
  MONITOR_DRAGGING: "is-dragging",
} as const;

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

/**
 * Monitor arrangement system
 */
@register({ GTypeName: "MonitorArrangement" })
export class MonitorArrangement extends Gtk.Box {
  private container: Gtk.Fixed;
  private monitors: Map<string, Gdk.Monitor> = new Map();
  private monitorWidgets: Map<string, DraggableBoxClass> = new Map();
  private allowOverlap: boolean = false;

  // Display area configuration
  private readonly CANVAS_WIDTH = 300;
  private readonly CANVAS_HEIGHT = 200;
  private readonly MONITOR_SCALE = 0.05; // 10% of actual size for display

  constructor(props: { allowOverlap?: boolean }) {
    super();

    // Property init
    const allowOverlap = props.allowOverlap ?? false;

    this.add_css_class(CSS_CLASSES.ARRANGEMENT);
    this.container = new Gtk.Fixed();
    this.allowOverlap = allowOverlap;
    this.vexpand = false;
    this.hexpand = false;
    this.setupCanvas();
    this.append(this.container);
  }

  private setupCanvas() {
    this.heightRequest = this.CANVAS_HEIGHT;
    this.widthRequest = this.CANVAS_WIDTH;
    this.container.heightRequest = this.CANVAS_HEIGHT;
    this.container.widthRequest = this.CANVAS_WIDTH;
    this.container.add_css_class(CSS_CLASSES.CANVAS);
  }

  /**
   * Add a Gdk.Monitor to the arrangement
   */
  addMonitor(monitor: Gdk.Monitor) {
    // Create positionable monitor widget
    const widget = this.createMonitorWidget(monitor);

    // Store reference
    this.monitors.set(monitor.get_connector() ?? "Undefined", monitor);
    this.monitorWidgets.set(monitor.get_connector() ?? "Undefined", widget);

    // Place monitor
    const canvasPos = this.worldToCanvas(
      monitor.geometry.x,
      monitor.geometry.y,
    );

    this.container.put(widget, canvasPos.x, canvasPos.y);
  }

  /**
   * Create draggable monitor widget
   */
  private createMonitorWidget(monitor: Gdk.Monitor): DraggableBoxClass {
    const displayWidth = monitor.geometry.width * this.MONITOR_SCALE;
    const displayHeight = monitor.geometry.height * this.MONITOR_SCALE;

    const snapConfig = {
      snapX: false,
      snapY: false,
      xIncrement: 1,
      yIncrement: 1,
      totalWidth: this.CANVAS_WIDTH,
      totalHeight: this.CANVAS_HEIGHT,
      xDivisions: 1,
      yDivisions: 1,
    };

    const bounds = {
      minX: 0,
      maxX: this.CANVAS_WIDTH - displayWidth,
      minY: 0,
      maxY: this.CANVAS_HEIGHT - displayHeight,
    };

    const draggable = DraggableBox({
      snapConfig,
      bounds,
      draggingClass: CSS_CLASSES.MONITOR_DRAGGING,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      data: monitor,
    });

    draggable.heightRequest = displayHeight;
    draggable.widthRequest = displayWidth;

    this.setupMonitorContent(draggable, monitor);
    this.setupMonitorDragHandlers(draggable, monitor);

    return draggable;
  }

  /** Set content for monitor widget */
  private setupMonitorContent(
    draggable: DraggableBoxClass,
    monitor: Gdk.Monitor,
  ) {
    const nameLabel = Widget.Label({
      label: monitor.get_connector() ?? "Undefined",
      css_classes: [CSS_CLASSES.MONITOR_LABEL],
      wrap: true,
      justify: Gtk.Justification.CENTER,
      halign: Gtk.Align.BASELINE_FILL,
      valign: Gtk.Align.BASELINE_FILL,
      vexpand: true,
    });

    draggable.append(nameLabel);
    draggable.add_css_class(CSS_CLASSES.MONITOR);
  }

  /**
   * Set up hooks to run at different drag stages
   */
  private setupMonitorDragHandlers(
    draggable: DraggableBoxClass,
    monitor: Gdk.Monitor,
  ) {
    let originalPosition: { x: number; y: number } = { x: 0, y: 0 };

    draggable.connect("dragStarted", (_, x, y) => {
      originalPosition.x = x;
      originalPosition.y = y;
    });

    draggable.connect(
      "dragUpdated",
      (widget: DraggableBoxClass, x, y, monitor) => {
        if (!this.allowOverlap) {
          const draggedWorldPos = this.canvasToWorld(x, y);

          // Get list of other monitors
          const otherMonitors = this.getMonitorConfiguration().filter(
            (otherMon) => otherMon.get_connector() !== monitor.get_connector(),
          );

          // Check collisions with any monitors
          const doesOverlap = otherMonitors.some((otherMon) =>
            this.checkCollisionDuringDrag(
              monitor,
              otherMon,
              draggedWorldPos.x,
              draggedWorldPos.y,
            ),
          );

          if (doesOverlap) {
            widget.add_css_class("collision");
          } else {
            widget.remove_css_class("collision");
          }
        }
      },
    );

    draggable.connect("dragEnded", (_, x: number, y: number) => {
      draggable.remove_css_class("collision");
      this.applyMonitorConfiguration(monitor, x, y);
    });
  }

  /**
   * Check if two monitors overlap using AABB (Axis-Aligned Bounding Box) collision detection
   */
  checkCollisionDuringDrag = (
    draggedMon: Gdk.Monitor,
    otherMon: Gdk.Monitor,
    draggedMonNewX: number,
    draggedMonNewY: number,
  ): boolean => {
    const geo1 = draggedMon.geometry;
    const geo2 = otherMon.geometry;

    return !(
      draggedMonNewX + geo1.width <= geo2.x || // draggedMon is completely to the left of otherMon
      draggedMonNewX >= geo2.x + geo2.width || // draggedMon is completely to the right of otherMon
      draggedMonNewY + geo1.height <= geo2.y || // draggedMon is completely above otherMon
      draggedMonNewY >= geo2.y + geo2.height // draggedMon is completely below otherMon
    );
  };

  private worldToCanvas(
    worldX: number,
    worldY: number,
  ): { x: number; y: number } {
    return {
      x: worldX * this.MONITOR_SCALE,
      y: worldY * this.MONITOR_SCALE,
    };
  }

  private canvasToWorld(
    canvasX: number,
    canvasY: number,
  ): { x: number; y: number } {
    return {
      x: canvasX / this.MONITOR_SCALE,
      y: canvasY / this.MONITOR_SCALE,
    };
  }

  /**
   * Apply monitor configuration using hyprctl
   */
  private async applyMonitorConfiguration(
    monitor: Gdk.Monitor,
    newCanvasX: number,
    newCanvasY: number,
  ) {
    // if (!monitor.isEnabled) return;

    const newWorldPos = this.canvasToWorld(newCanvasX, newCanvasY);

    const cmdParams = [
      "hyprctl",
      "keyword",
      "monitor",
      `${monitor.connector},${monitor.geometry.width}x${monitor.geometry.height},${newWorldPos.x}x${newWorldPos.y},${monitor.scale}`,
    ];

    try {
      const cmd = cmdParams.join(" ");
      execAsync(cmd).catch(console.log);
    } catch (error) {
      console.error(`Failed to apply monitor config: ${error}`);
    }
  }

  public setAllowOverlap(allow: boolean) {
    this.allowOverlap = allow;
  }

  public getMonitorConfiguration(): Gdk.Monitor[] {
    return Array.from(this.monitors.values());
  }
}
