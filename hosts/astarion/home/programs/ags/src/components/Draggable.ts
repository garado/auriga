/**
 * █▀▀ █▀▀ █▄░█ █▀▀ █▀█ █ █▀▀   █▀▄ █▀█ ▄▀█ █▀▀ █▀▀ ▄▀█ █▄▄ █░░ █▀▀
 * █▄█ ██▄ █░▀█ ██▄ █▀▄ █ █▄▄   █▄▀ █▀▄ █▀█ █▄█ █▄█ █▀█ █▄█ █▄▄ ██▄
 *
 * Generic draggable box widget with configurable snapping behavior.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Gtk } from "astal/gtk4";
import GObject, { register, property, signal } from "astal/gobject";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

/**
 * Represents drag state and position data while dragging
 */
interface DragState {
  /** Current x position */
  x: number;
  /** Current y position */
  y: number;
  /** Delta x from drag start */
  dx: number;
  /** Delta y from drag start */
  dy: number;
  /** Whether currently dragging */
  isDragging: boolean;
}

/**
 * Configuration for snapping behavior
 */
interface SnapConfig {
  /** Enable snapping on X axis */
  snapX: boolean;
  /** Enable snapping on Y axis */
  snapY: boolean;
  /** X-axis snap increment (e.g., grid width) */
  xIncrement: number;
  /** Y-axis snap increment (e.g., time slots) */
  yIncrement: number;
  /** Total width for X calculations */
  totalWidth: number;
  /** Total height for Y calculations */
  totalHeight: number;
  /** Number of X divisions (e.g., days in week) */
  xDivisions: number;
  /** Number of Y divisions (e.g., hours in day) */
  yDivisions: number;
}

/**
 * Boundary constraints for dragging
 */
interface DragBounds {
  /** Minimum X position */
  minX: number;
  /** Maximum X position */
  maxX: number;
  /** Minimum Y position */
  minY: number;
  /** Maximum Y position */
  maxY: number;
}

interface DraggableBoxProps extends Gtk.Widget.ConstructorProps {
  /** Snapping configuration */
  snapConfig?: Partial<SnapConfig>;
  /** Drag boundary constraints */
  bounds?: Partial<DragBounds>;
  /** CSS classes to apply when dragging */
  draggingClass?: string;
  /** Custom cursor when hovering */
  cursor?: Gdk.Cursor;
  /** Data payload associated with this draggable */
  data?: any;
}

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

/**
 * A generic draggable box widget with configurable snapping and constraints
 */
@register({
  GTypeName: "DraggableBox",
  Signals: {
    dragStarted: { param_types: [GObject.TYPE_INT, GObject.TYPE_INT] },
    dragUpdated: {
      param_types: [GObject.TYPE_INT, GObject.TYPE_INT, GObject.TYPE_OBJECT],
    },
    dragEnded: {
      param_types: [GObject.TYPE_INT, GObject.TYPE_INT, GObject.TYPE_OBJECT],
    },
    positionChanged: { param_types: [GObject.TYPE_OBJECT] },
  },
})
export class DraggableBoxClass extends Gtk.Box {
  // Properties ----------------------------------------------------------------
  @property(Object) declare snapConfig: SnapConfig;
  @property(Object) declare bounds: DragBounds;
  @property(String) declare draggingClass: string;
  @property(Object) declare data: any;

  // Gesture controller
  @property(Gtk.GestureDrag) declare dragController: Gtk.GestureDrag;

  // Signals -------------------------------------------------------------------
  @signal(Object) declare dragStarted: (x: number, y: number) => void;

  @signal(Object, Object) declare dragUpdated: (
    x: number,
    y: number,
    data: any,
  ) => void;

  @signal(Object, Object) declare dragEnded: (
    x: number,
    y: number,
    data: any,
  ) => void;

  @signal(Object) declare positionChanged: (position: {
    x: number;
    y: number;
  }) => void;

  // Private state -------------------------------------------------------------
  private dragState: DragState = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    isDragging: false,
  };

  private defaultSnapConfig: SnapConfig = {
    snapX: true,
    snapY: true,
    xIncrement: 1,
    yIncrement: 1,
    totalWidth: 100,
    totalHeight: 100,
    xDivisions: 7,
    yDivisions: 24,
  };

  private defaultBounds: DragBounds = {
    minX: 0,
    maxX: Infinity,
    minY: 0,
    maxY: Infinity,
  };

  // Constructor ---------------------------------------------------------------
  constructor(props: Partial<DraggableBoxProps> = {}) {
    super(props as any);

    // Merge configurations with defaults
    this.snapConfig = { ...this.defaultSnapConfig, ...props.snapConfig };
    this.bounds = { ...this.defaultBounds, ...props.bounds };
    this.draggingClass = props.draggingClass || "dragging";
    this.data = props.data;

    this.initializeWidget(props);
    this.setupDragHandler();
  }

  // Initialization ------------------------------------------------------------

  /**
   * Initialize widget state and appearance
   */
  private initializeWidget = (props: Partial<DraggableBoxProps>) => {
    this.orientation = Gtk.Orientation.VERTICAL;

    if (props.cursor) {
      this.cursor = props.cursor;
    }
  };

  /**
   * Set up drag gesture handling
   */
  private setupDragHandler = () => {
    this.dragController = new Gtk.GestureDrag();
    this.add_controller(this.dragController);

    this.dragController.connect("drag-begin", this.onDragBegin.bind(this));
    this.dragController.connect("drag-update", this.onDragUpdate.bind(this));
    this.dragController.connect("drag-end", this.onDragEnd.bind(this));
  };

  // Drag event handlers -------------------------------------------------------

  private onDragBegin = () => {
    this.add_css_class(this.draggingClass);
    this.dragState.isDragging = true;

    // Get current position from parent (assuming Gtk.Fixed)
    const parent = this.get_parent();
    if (parent && parent instanceof Gtk.Fixed) {
      [this.dragState.x, this.dragState.y] = parent.get_child_position(this);
    }

    this.emit("dragStarted", this.dragState.x, this.dragState.y);
  };

  private onDragUpdate = (_unused: any, dx: number, dy: number) => {
    if (!this.dragState.isDragging) return;

    this.dragState.dx = dx;
    this.dragState.dy = dy;

    // Calculate new position with snapping
    let newX = this.dragState.x + dx;
    let newY = this.dragState.y + dy;

    if (this.snapConfig.snapX) {
      newX = this.snapToXGrid(newX);
    }

    if (this.snapConfig.snapY) {
      newY = this.snapToYGrid(newY);
    }

    // Apply boundary constraints
    newX = this.constrainX(newX);
    newY = this.constrainY(newY);

    // Update position
    this.dragState.x = newX;
    this.dragState.y = newY;

    // Move widget
    const parent = this.get_parent();
    if (parent && parent instanceof Gtk.Fixed) {
      parent.move(this, this.dragState.x, this.dragState.y);
    }

    this.emit("dragUpdated", this.dragState.x, this.dragState.y, this.data);
    // this.emit("positionChanged", { x: this.dragState.x, y: this.dragState.y });
  };

  private onDragEnd = () => {
    this.remove_css_class(this.draggingClass);
    this.dragState.isDragging = false;

    this.emit("dragEnded", this.dragState.x, this.dragState.y, this.data);
  };

  // Snapping logic ------------------------------------------------------------

  /**
   * Snap X coordinate to grid
   */
  private snapToXGrid = (x: number): number => {
    const { xDivisions, totalWidth, xIncrement } = this.snapConfig;
    const gridSize = totalWidth / xDivisions;
    return Math.round(x / gridSize / xIncrement) * xIncrement * gridSize;
  };

  /**
   * Snap Y coordinate to grid
   */
  private snapToYGrid = (y: number): number => {
    const { yDivisions, totalHeight, yIncrement } = this.snapConfig;
    const gridSize = totalHeight / yDivisions;
    return Math.round(y / gridSize / yIncrement) * yIncrement * gridSize;
  };

  // Boundary constraints ------------------------------------------------------

  /**
   * Constrain X coordinate to bounds
   */
  private constrainX = (x: number): number => {
    return Math.max(this.bounds.minX, Math.min(this.bounds.maxX, x));
  };

  /**
   * Constrain Y coordinate to bounds
   */
  private constrainY = (y: number): number => {
    return Math.max(this.bounds.minY, Math.min(this.bounds.maxY, y));
  };

  // Public API ----------------------------------------------------------------

  /**
   * Get current position
   */
  getPosition = (): { x: number; y: number } => {
    return { x: this.dragState.x, y: this.dragState.y };
  };

  /**
   * Set position programmatically
   */
  setPosition = (x: number, y: number, animate: boolean = false) => {
    this.dragState.x = x;
    this.dragState.y = y;

    const parent = this.get_parent();
    if (parent && parent instanceof Gtk.Fixed) {
      if (animate) {
        // Add animation class and remove after transition
        this.add_css_class("position-transition");
        setTimeout(() => this.remove_css_class("position-transition"), 300);
      }
      parent.move(this, x, y);
    }

    this.emit("positionChanged", { x, y });
  };

  /**
   * Update snap configuration
   */
  updateSnapConfig = (newConfig: Partial<SnapConfig>) => {
    this.snapConfig = { ...this.snapConfig, ...newConfig };
  };

  /**
   * Update boundary constraints
   */
  updateBounds = (newBounds: Partial<DragBounds>) => {
    this.bounds = { ...this.bounds, ...newBounds };
  };

  /**
   * Get the grid index for current position
   */
  getGridPosition = (): { xIndex: number; yIndex: number } => {
    const { xDivisions, yDivisions, totalWidth, totalHeight } = this.snapConfig;

    const xIndex = Math.floor((this.dragState.x / totalWidth) * xDivisions);
    const yIndex = Math.floor((this.dragState.y / totalHeight) * yDivisions);

    return { xIndex, yIndex };
  };

  /**
   * Check if currently being dragged
   */
  isDragging = (): boolean => {
    return this.dragState.isDragging;
  };
}

/**
 * Factory function to create DraggableBox instances
 */
export const DraggableBox = (props: Partial<DraggableBoxProps> = {}) => {
  return new DraggableBoxClass(props);
};
