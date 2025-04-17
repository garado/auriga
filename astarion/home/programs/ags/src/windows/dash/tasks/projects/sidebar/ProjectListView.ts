/**
 * █▀█ █▀█ █▀█ ░░█ █▀▀ █▀▀ ▀█▀   █░░ █ █▀ ▀█▀   █░█ █ █▀▀ █░█░█
/* █▀▀ █▀▄ █▄█ █▄█ ██▄ █▄▄ ░█░   █▄▄ █ ▄█ ░█░   ▀▄▀ █ ██▄ ▀▄▀▄▀
 * 
 * Convert TaskWarrior project hierarchy of type Tree<Project>
 * into a list view widget
 */

import { Project } from "@/services/Tasks";
import { Gio, GObject } from "astal";
import { Gtk, Widget } from "astal/gtk4";
import Ts from "@/services/Tasks";
import Tree, { TreeNode } from "@/utils/Tree";

const ts = Ts.get_default();

/**
 * GObject wrapper for TreeNode<Project>
 */
const GProjectNode = GObject.registerClass(
  {
    Properties: {
      data: GObject.ParamSpec.object(
        "data",
        "data",
        "Project data",
        GObject.ParamFlags.READWRITE,
        GObject.Object,
      ),
      hasChildren: GObject.ParamSpec.boolean(
        "hasChildren",
        "hasChildren",
        "Whether this node has children",
        GObject.ParamFlags.READWRITE,
        false,
      ),
      depth: GObject.ParamSpec.int(
        "depth",
        "depth",
        "Tree depth depth",
        GObject.ParamFlags.READWRITE,
        0,
        100,
        0,
      ),
    },
  },
  class GProjectNode extends GObject.Object {
    data!: Project;
    hasChildren!: boolean;
    depth!: number;
    _node: TreeNode<Project>;

    constructor(project: TreeNode<Project>, depth: number = 0) {
      super();
      this.data = project.data;
      this.hasChildren = project.children && project.children.length > 0;
      this.depth = depth;
      this._node = project; // Store the original node for reference
    }

    getChildNodes(): TreeNode<Project>[] {
      return this._node.children || [];
    }
  },
);

/**
 * @function createListStoreFromNodes
 * @brief Creates a Gio.ListStore from an array of TreeNode<Project>
 */
const createListStoreFromNodes = (
  nodes: TreeNode<Project>[],
  depth: number = 0,
): Gio.ListStore => {
  const store = new Gio.ListStore();

  nodes.forEach((node) => {
    const gProject = new GProjectNode(node, depth);
    store.append(gProject);
  });

  return store;
};

/**
 * @function ProjectTreeList
 * @brief Create GtkListView from Tree<Project>
 */
const ProjectTreeList = (data: Tree<Project>) => {
  if (!data || !data.root) {
    console.error("No valid tree data provided");
    return new Gtk.Box();
  }

  // Create root list store with the root's children
  const rootNodes = data.root.children || [];
  const rootStore = createListStoreFromNodes(rootNodes, 0);

  // Create tree list model
  const treeModel = Gtk.TreeListModel.new(
    rootStore,
    false, // Passthrough (false means we get TreeListRow objects)
    false, // Autoexpand (false means manual expansion)

    // Function to get children
    (item: GObject.Object) => {
      const gProject = item as GProjectNode;

      // Only create child model if this node has children
      if (!gProject.hasChildren) {
        return null;
      }

      // Get children and create store with increased depth
      const childNodes = gProject.getChildNodes();
      return createListStoreFromNodes(childNodes, gProject.depth + 1);
    },
  );

  // Create factory for list items
  const factory = new Gtk.SignalListItemFactory();

  // Instantiate list widget
  factory.connect("setup", (_factory, listItem: Gtk.ListItem) => {
    const expander = new Gtk.TreeExpander({
      cssClasses: ["expander"],
      marginEnd: 6,
      hexpand: false,
    });

    const label = Widget.Label({
      halign: Gtk.Align.START,
      hexpand: false,
      ellipsize: 3, // PANGO_ELLIPSIZE_END
      cssClasses: ["project"],
    });

    const button = new Gtk.Button({
      cssClasses: ["flat"],
      hexpand: false,
      child: label,
    });

    const box = Widget.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 6,
      marginStart: 6,
      marginEnd: 6,
      marginTop: 3,
      marginBottom: 3,
      hexpand: false,
      children: [expander, button],
    });

    // Store references to widgets
    listItem.set_child(box);
  });

  // Update list widget with data
  factory.connect("bind", (_factory, listItem: Gtk.ListItem) => {
    const box = listItem.get_child() as Gtk.Box;
    const expander = box.get_first_child() as Gtk.TreeExpander;
    const button = expander.get_next_sibling() as Gtk.Button;
    const label = button.get_child() as Gtk.Label;

    // Get row and item data
    const treeListRow = listItem.get_item() as Gtk.TreeListRow;
    const gProject = treeListRow.get_item() as GProjectNode;

    // Connect expander to the row
    expander.set_list_row(treeListRow);

    // Show/hide expander based on whether item has children
    if (gProject.hasChildren) {
      expander.add_css_class("expandable");
    }

    // Set project name in label
    if (gProject && gProject.data) {
      label.set_label(gProject.data.name || "Untitled Project");
    } else {
      label.set_label("Unknown Project");
    }

    /* Add indentation based on depth */
    box.set_margin_start(6 + gProject.depth * 12);

    // Handle button click to toggle expansion
    button.connect("clicked", () => {
      const isExpanded = treeListRow.get_expanded();
      treeListRow.set_expanded(!isExpanded);

      // Select this row
      const selectionModel = listView.get_model() as Gtk.SingleSelection;
      const position = listItem.get_position();
      selectionModel.set_selected(position);
    });
  });

  // Create selection model
  const selectionModel = new Gtk.SingleSelection({
    model: treeModel,
    autoselect: false,
    canUnselect: true,
  });

  selectionModel.connect("selection-changed", (model, _position, _nItems) => {
    const selected = model.get_selected();
    if (selected !== Gtk.INVALID_LIST_POSITION) {
      const treeListRow = model.get_item(selected) as Gtk.TreeListRow;
      const gProject = treeListRow.get_item() as GProjectNode;

      if (ts.selectedProject != gProject._node) {
        ts.newProjectSelected(gProject._node);
      }
    }
  });

  const listView = new Gtk.ListView({
    model: selectionModel,
    factory: factory,
    showSeparators: true,
    cssClasses: ["project-tree-view"],
    vexpand: true,
  });

  return new Gtk.ScrolledWindow({
    hscrollbarPolicy: Gtk.PolicyType.NEVER,
    vscrollbarPolicy: Gtk.PolicyType.AUTOMATIC,
    hexpand: true,
    vexpand: true,
    child: listView,
  });
};

export const ProjectListView = () => {
  const box = Widget.Box({
    orientation: Gtk.Orientation.VERTICAL,
    vexpand: true,
    hexpand: false,
    setup: (self) => {
      ts.connect("notify::data", () => {
        if (ts.data) {
          const widget = ProjectTreeList(ts.data);
          self.append(widget);
        }
      });
    },
  });

  return box;
};
