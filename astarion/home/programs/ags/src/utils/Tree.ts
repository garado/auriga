/**
 * ▀█▀ █▀█ █▀▀ █▀▀
 * ░█░ █▀▄ ██▄ ██▄
 *
 * Basic tree data structure implementation.
 */

export class TreeNode<T> {
  data: T;
  children: TreeNode<T>[];
  parent: TreeNode<T> | null; // Add parent field

  constructor(data: T) {
    this.data = data;
    this.children = [];
    this.parent = null; // Initialize parent to null
  }

  addChild(node: TreeNode<T>): void {
    node.parent = this; // Set the parent when adding a child
    this.children.push(node);
  }

  removeChild(node: TreeNode<T>): void {
    this.children = this.children.filter((child) => child !== node);
    node.parent = null; // Set parent to null when removing a child
  }
}

export default class Tree<T> {
  root: TreeNode<T> | null;

  constructor() {
    this.root = null;
  }

  addRoot(data: T): void {
    this.root = new TreeNode<T>(data);
  }

  traverseDFS(callback: (data: T) => void): void {
    this.traverseDFSUtil(this.root, callback);
  }

  private traverseDFSUtil(
    node: TreeNode<T> | null,
    callback: (data: T) => void,
  ): void {
    if (node) {
      callback(node.data);
      node.children.forEach((child) => this.traverseDFSUtil(child, callback));
    }
  }

  traverseBFS(callback: (data: T) => void): void {
    if (!this.root) return;

    const queue: TreeNode<T>[] = [this.root];
    while (queue.length > 0) {
      const current = queue.shift()!;
      callback(current.data);
      queue.push(...current.children);
    }
  }

  toString(): void {
    const printNode = (node: TreeNode<T> | null, level = 0) => {
      if (!node) return;
      const indent = "  ".repeat(level);
      print(`${indent}- ${String((node.data as any).name ?? node.data)}`);
      node.children.forEach((child) => printNode(child, level + 1));
    };
  }
}
