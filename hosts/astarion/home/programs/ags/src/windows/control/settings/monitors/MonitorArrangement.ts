/**
 * Monitor positioning system with collision detection and auto-arrangement
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

// Collision detection result
interface CollisionInfo {
  hasCollision: boolean;
  overlappingMonitors: string[];
  suggestedPosition?: { x: number; y: number };
}

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
  private readonly SNAP_THRESHOLD = 20; // Pixels for edge snapping

  constructor(container: Gtk.Fixed, allowOverlap: boolean = false) {
    super();
    this.add_css_class(CSS_CLASSES.ARRANGEMENT);
    this.container = container;
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

      console.log(`Original pos of ${monitor.get_connector()}: (${x},${y})`);
    });

    // @TODO this is broken af
    draggable.connect("dragUpdated", (_, x, y, _data) => {
      if (!this.allowOverlap) {
        const worldPos = this.canvasToWorld(x, y);

        // Check for edge snapping
        const snappedPos = this.getSnappedPosition(
          monitor.get_connector(),
          worldPos,
        );

        // Check for collisions
        const collision = this.checkCollisions(
          monitor.get_connector(),
          snappedPos,
          monitor.geometry.width,
          monitor.geometry.height,
        );

        if (collision.hasCollision) {
          // Visual feedback for collision
          draggable.add_css_class("collision");

          if (collision.suggestedPosition) {
            // Auto-suggest non-colliding position
            const suggestedCanvas = this.worldToCanvas(
              collision.suggestedPosition.x,
              collision.suggestedPosition.y,
            );
            this.showSuggestionGhost(suggestedCanvas);
          }
        } else {
          draggable.remove_css_class("collision");
          this.hideSuggestionGhost();
        }
      }
    });

    draggable.connect("dragEnded", (_, x: number, y: number) => {
      console.log(`Drag ended ${monitor.get_description()}: ${x}, ${y}`);

      draggable.remove_css_class("collision");
      this.hideSuggestionGhost();

      console.log(
        `Moved ${monitor.get_description()} from (${originalPosition.x},${originalPosition.y}) to (${x}, ${y})`,
      );

      // Apply to system
      this.applyMonitorConfiguration(monitor, x, y);

      // const snappedPos = this.getSnappedPosition(
      //   monitor.get_connector(),
      //   worldPos,
      // );

      // if (!this.allowOverlap) {
      //   const collision = this.checkCollisions(
      //     monitor.get_connector(),
      //     snappedPos,
      //     monitor.geometry.width,
      //     monitor.geometry.height,
      //   );

      //   if (collision.hasCollision) {
      //     // Revert to original position or use suggested position
      //     if (collision.suggestedPosition) {
      //       this.moveMonitorTo(
      //         monitor.get_connector(),
      //         collision.suggestedPosition,
      //       );
      //     } else {
      //       // Revert
      //       draggable.setPosition(originalPosition.x, originalPosition.y);
      //       return;
      //     }
      //   }
      // }
    });
  }

  /**
   * Edge snapping logic - snap monitors to each other's edges
   */
  private getSnappedPosition(
    draggedId: string,
    position: { x: number; y: number },
  ): { x: number; y: number } {
    const draggedMonitor = this.monitors.get(draggedId)!;
    let bestX = position.x;
    let bestY = position.y;
    let minDistanceX = this.SNAP_THRESHOLD;
    let minDistanceY = this.SNAP_THRESHOLD;

    for (const [id, monitor] of this.monitors) {
      if (id === draggedId) continue;

      // Check horizontal alignment (snap to left/right edges)
      const rightEdgeDistance = Math.abs(
        position.x - (monitor.geometry.x + monitor.geometry.width),
      );
      const leftEdgeDistance = Math.abs(position.x - monitor.geometry.x);
      const rightToLeftDistance = Math.abs(
        position.x + draggedMonitor.geometry.width - monitor.geometry.x,
      );

      if (rightEdgeDistance < minDistanceX) {
        bestX = monitor.geometry.x + monitor.geometry.width;
        minDistanceX = rightEdgeDistance;
      }
      if (leftEdgeDistance < minDistanceX) {
        bestX = monitor.geometry.x;
        minDistanceX = leftEdgeDistance;
      }
      if (rightToLeftDistance < minDistanceX) {
        bestX = monitor.geometry.x - draggedMonitor.geometry.width;
        minDistanceX = rightToLeftDistance;
      }

      // Check vertical alignment (snap to top/bottom edges)
      const bottomEdgeDistance = Math.abs(
        position.y - (monitor.geometry.y + monitor.geometry.height),
      );
      const topEdgeDistance = Math.abs(position.y - monitor.geometry.y);
      const bottomToTopDistance = Math.abs(
        position.y + draggedMonitor.geometry.height - monitor.geometry.y,
      );

      if (bottomEdgeDistance < minDistanceY) {
        bestY = monitor.geometry.y + monitor.geometry.height;
        minDistanceY = bottomEdgeDistance;
      }
      if (topEdgeDistance < minDistanceY) {
        bestY = monitor.geometry.y;
        minDistanceY = topEdgeDistance;
      }
      if (bottomToTopDistance < minDistanceY) {
        bestY = monitor.geometry.y - draggedMonitor.geometry.height;
        minDistanceY = bottomToTopDistance;
      }
    }

    return { x: bestX, y: bestY };
  }

  /**
   * Collision detection
   */
  private checkCollisions(
    excludeId: string,
    position: { x: number; y: number },
    width: number,
    height: number,
  ): CollisionInfo {
    const overlapping: string[] = [];

    for (const [id, monitor] of this.monitors) {
      if (id === excludeId) continue;

      // AABB collision detection
      const collision = !(
        position.x + width <= monitor.geometry.x ||
        position.x >= monitor.geometry.x + monitor.geometry.width ||
        position.y + height <= monitor.geometry.y ||
        position.y >= monitor.geometry.y + monitor.geometry.height
      );

      if (collision) {
        overlapping.push(id);
      }
    }

    let suggestedPosition: { x: number; y: number } | undefined;
    if (overlapping.length > 0) {
      // Find nearest non-colliding position
      suggestedPosition = this.findNearestFreePosition(
        position,
        width,
        height,
        excludeId,
      );
    }

    return {
      hasCollision: overlapping.length > 0,
      overlappingMonitors: overlapping,
      suggestedPosition,
    };
  }

  /**
   * Find nearest position without collisions
   */
  private findNearestFreePosition(
    preferredPos: { x: number; y: number },
    width: number,
    height: number,
    excludeId: string,
  ): { x: number; y: number } | undefined {
    const step = 50; // Check positions in 50px steps
    const maxRadius = 500; // Don't search too far

    for (let radius = step; radius <= maxRadius; radius += step) {
      // Check positions in a spiral around the preferred position
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const testX = preferredPos.x + Math.cos(rad) * radius;
        const testY = preferredPos.y + Math.sin(rad) * radius;

        const collision = this.checkCollisions(
          excludeId,
          { x: testX, y: testY },
          width,
          height,
        );
        if (!collision.hasCollision) {
          return { x: testX, y: testY };
        }
      }
    }

    return undefined;
  }

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

  // @TODO remove
  private updatePositionDisplay(
    draggable: DraggableBoxClass,
    worldPos: { x: number; y: number },
  ) {
    const posLabel = draggable.get_last_child() as Gtk.Label;
    if (posLabel) {
      posLabel.set_label(
        `(${Math.round(worldPos.x)}, ${Math.round(worldPos.y)})`,
      );
    }
  }

  private suggestionGhost: Gtk.Widget | null = null;

  private showSuggestionGhost(position: { x: number; y: number }) {
    if (!this.suggestionGhost) {
      this.suggestionGhost = new Gtk.Box({
        css_classes: ["monitor-suggestion"],
      });
      this.container.put(this.suggestionGhost, position.x, position.y);
    } else {
      this.container.move(this.suggestionGhost, position.x, position.y);
    }
  }

  private hideSuggestionGhost() {
    if (this.suggestionGhost) {
      this.container.remove(this.suggestionGhost);
      this.suggestionGhost = null;
    }
  }

  private moveMonitorTo(id: string, worldPos: { x: number; y: number }) {
    const widget = this.monitorWidgets.get(id);
    const monitor = this.monitors.get(id);
    if (widget && monitor) {
      const canvasPos = this.worldToCanvas(worldPos.x, worldPos.y);
      widget.setPosition(canvasPos.x, canvasPos.y, true);
      monitor.geometry.x = worldPos.x;
      monitor.geometry.y = worldPos.y;
    }
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

    // Apply new positions
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

  // Public API
  public setAllowOverlap(allow: boolean) {
    this.allowOverlap = allow;
  }

  public getMonitorConfiguration(): Gdk.Monitor[] {
    return Array.from(this.monitors.values());
  }

  public autoArrange() {
    // Implement auto-arrangement algorithm (e.g., horizontal layout)
    // @TODO fix sorting
    let currentX = 0;
    const sortedMonitors = Array.from(this.monitors.values()).sort(
      (a, b) => -1,
      // a.isPrimary ? -1 : 1,
    ); // Primary first

    for (const monitor of sortedMonitors) {
      this.moveMonitorTo(monitor.get_connector(), { x: currentX, y: 0 });
      currentX += monitor.geometry.width;
    }
  }
}
