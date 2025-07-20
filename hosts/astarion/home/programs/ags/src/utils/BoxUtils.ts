import { Gtk } from "astal/gtk4";

// why this isn't built into gtk4 is beyond me
export const getChildAtIndex = (
  container: Gtk.Widget,
  index: number,
): Gtk.Widget | null => {
  let child = container.get_first_child();
  let currentIndex = 0;

  while (child !== null && currentIndex < index) {
    child = child.get_next_sibling();
    currentIndex++;
  }

  return child;
};

export const replaceChildAt = (
  box: Gtk.Box,
  index: number,
  newChild: Gtk.Widget,
): void => {
  let child = box.get_first_child();
  let currentIndex = 0;

  // Find the child at index
  while (child !== null && currentIndex < index) {
    child = child.get_next_sibling();
    currentIndex++;
  }

  if (child) {
    // Get the next sibling before removing
    const nextSibling = child.get_next_sibling();

    // Remove old child
    box.remove(child);

    // Insert new child at the same position
    if (nextSibling) {
      box.insert_before(newChild, nextSibling);
    } else {
      box.append(newChild);
    }
  }
};

export const clearChildren = (box: Gtk.Box): void => {
  while (true) {
    const child = box.get_first_child();
    if (!child) break;
    box.remove(child);
  }
};
