import { Gtk, Gdk, Widget, astalify, hook } from "astal/gtk4";
import { register, property } from "astal/gobject";
import Goals, { Goal } from "@/services/Goals";

const gs = Goals.get_default();

interface SidebarProps extends Gtk.Box.ConstructorProps {}

@register({ GTypeName: "Sidebar" })
export class _Sidebar extends Gtk.Box {
  /* Properties */
  @property(Object)
  declare goal: Goal;

  @property(Boolean)
  declare isBigPicture?: boolean;

  constructor(props: Partial<SidebarProps>) {
    super(props as any);
    this.vexpand = true;
    this.hexpand = false;
    this.visible = false;

    this.append(
      Widget.Label({
        label: "Sidebar",
      }),
    );
  }
}

export const Sidebar = (props: Partial<SidebarProps>) => {
  return new _Sidebar(props);
};
