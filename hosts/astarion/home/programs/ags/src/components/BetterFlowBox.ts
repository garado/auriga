import { GLib, GObject } from "astal";
import { Gtk } from "astal/gtk4";

/**
 * Fake masonry using vertical box of horizontal boxes
 * Wraps to new row when width is exceeded
 */
export const FlowLayout = GObject.registerClass(
  { GTypeName: "FlowLayout" },
  class extends Gtk.Box {
    private rows: Gtk.Box[] = [];
    private currentRowWidths: number[] = [];
    private _columnSpacing: number = 8;
    private _rowSpacing: number = 8;
    private _children: Gtk.Widget[] = [];

    constructor(props: any = {}) {
      const { rowSpacing, columnSpacing, children, ...gtkProps } = props;

      super({
        orientation: Gtk.Orientation.VERTICAL,
        ...gtkProps,
      });

      this._columnSpacing = rowSpacing || 8;
      this._rowSpacing = columnSpacing || 8;
      this.spacing = this._rowSpacing;

      if (children && Array.isArray(children)) {
        children.forEach((child: Gtk.Widget) => this.addChild(child));
      }
    }

    get spacing(): number {
      return this._rowSpacing;
    }

    set spacing(value: number) {
      if (this._columnSpacing !== value) {
        this._columnSpacing = value;
        this.set_spacing(value);
        this.rows.forEach((row) => row.set_spacing(value));
        this.notify("spacing");
      }
    }

    private getWidgetNaturalWidth(widget: Gtk.Widget): number {
      const [_min, nat] = widget.measure(Gtk.Orientation.HORIZONTAL, -1);
      return nat + 15;
    }

    private createNewRow(): Gtk.Box {
      const row = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: this._columnSpacing,
        homogeneous: false,
        hexpand: false,
        halign: Gtk.Align.START,
      });

      this.append(row);
      this.rows.push(row);
      this.currentRowWidths.push(0);

      return row;
    }

    private getCurrentRow(): Gtk.Box {
      if (this.rows.length === 0) {
        return this.createNewRow();
      }
      return this.rows[this.rows.length - 1];
    }

    private getCurrentRowWidth(): number {
      return this.currentRowWidths[this.currentRowWidths.length - 1] || 0;
    }

    private addWidthToCurrentRow(width: number): void {
      if (this.currentRowWidths.length > 0) {
        this.currentRowWidths[this.currentRowWidths.length - 1] += width;
      }
    }

    private getAvailableWidth(): number {
      const allocation = this.get_allocated_width();
      return allocation > 0 ? allocation : 400; // fallback
    }

    // Public API
    addChild(child: Gtk.Widget): void {
      this._children.push(child);

      const childWidth = this.getWidgetNaturalWidth(child);
      const availableWidth = this.getAvailableWidth();
      const currentRowWidth = this.getCurrentRowWidth();

      // Check if widget fits in current row
      const willFit =
        currentRowWidth +
          childWidth +
          (currentRowWidth > 0 ? this._columnSpacing : 0) <=
        availableWidth;

      let targetRow: Gtk.Box;

      if (willFit && this.rows.length > 0) {
        // Add to current row
        targetRow = this.getCurrentRow();
        this.addWidthToCurrentRow(
          childWidth + (currentRowWidth > 0 ? this._columnSpacing : 0),
        );
      } else {
        // Create new row
        targetRow = this.createNewRow();
        this.addWidthToCurrentRow(childWidth);
      }

      targetRow.append(child);
    }

    removeChild(child: Gtk.Widget): void {
      const index = this._children.indexOf(child);
      if (index >= 0) {
        this._children.splice(index, 1);

        // Find and remove from row
        this.rows.forEach((row) => {
          if (child.get_parent() === row) {
            row.remove(child);
          }
        });

        // Clean up empty rows
        this.cleanupEmptyRows();
      }
    }

    private cleanupEmptyRows(): void {
      for (let i = this.rows.length - 1; i >= 0; i--) {
        const row = this.rows[i];
        if (!row.get_first_child()) {
          this.remove(row);
          this.rows.splice(i, 1);
          this.currentRowWidths.splice(i, 1);
        }
      }
    }

    clear(): void {
      this._children = [];
      this.rows.forEach((row) => {
        this.remove(row);
      });
      this.rows = [];
      this.currentRowWidths = [];
    }

    // Reflow on resize
    private reflow(): void {
      const children = [...this._children];
      this.clear();
      children.forEach((child) => this.addChild(child));
    }

    vfunc_size_allocate(width: number, height: number, baseline: number): void {
      const oldWidth = this.get_allocated_width();
      super.vfunc_size_allocate(width, height, baseline);

      // Reflow if width changed significantly
      if (Math.abs(width - oldWidth) > 50) {
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
          this.reflow();
          return false;
        });
      }
    }

    getChildren(): Gtk.Widget[] {
      return [...this._children];
    }
  },
);

// Factory function
export default (
  props: {
    spacing?: number;
    children?: Gtk.Widget[];
    cssClasses?: string[];
    canFocus?: boolean;
    vexpand?: boolean;
    hexpand?: boolean;
    halign?: Gtk.Align;
    valign?: Gtk.Align;
    [key: string]: any;
  } = {},
) => {
  return new FlowLayout(props);
};
