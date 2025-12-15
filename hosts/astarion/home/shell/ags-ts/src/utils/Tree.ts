/**
 * ▀█▀ █▀█ █▀▀ █▀▀
 * ░█░ █▀▄ ██▄ ██▄
 *
 * Basic tree data structure implementation with bidirectional parent-child relationships.
 */

/**
 * Represents a single node in a tree structure
 * @template T - The type of data stored in the node
 */
export class TreeNode<T> {
  /** The data stored in this node */
  data: T;

  /** Array of child nodes */
  children: TreeNode<T>[];

  /** Reference to parent node, null if this is the root */
  parent: TreeNode<T> | null;

  /**
   * Creates a new tree node with the given data
   * @param data - The data to store in this node
   */
  constructor(data: T) {
    this.data = data;
    this.children = [];
    this.parent = null;
  }

  /**
   * Adds a child node to this node and sets up bidirectional parent-child relationship
   * @param node - The node to add as a child
   */
  addChild(node: TreeNode<T>): void {
    node.parent = this; // Establish parent relationship
    this.children.push(node);
  }

  /**
   * Removes a child node from this node and breaks the parent-child relationship
   * @param node - The child node to remove
   */
  removeChild(node: TreeNode<T>): void {
    this.children = this.children.filter((child) => child !== node);
    node.parent = null; // Break parent relationship
  }
}

/**
 * Generic tree data structure with traversal and utility methods
 * @template T - The type of data stored in tree nodes
 */
export default class Tree<T> {
  /** The root node of the tree, null if tree is empty */
  root: TreeNode<T> | null;

  /**
   * Creates a new empty tree
   */
  constructor() {
    this.root = null;
  }

  /**
   * Sets the root node of the tree with the given data
   * @param data - The data for the root node
   */
  addRoot(data: T): void {
    this.root = new TreeNode<T>(data);
  }

  /**
   * Traverses the tree in depth-first order, calling the callback for each node
   * @param callback - Function to call for each node's data during traversal
   */
  traverseDFS(callback: (data: T) => void): void {
    this.traverseDFSUtil(this.root, callback);
  }

  /**
   * Utility method for recursive depth-first traversal
   * @param node - Current node being processed
   * @param callback - Function to call for each node's data
   * @private
   */
  private traverseDFSUtil(
    node: TreeNode<T> | null,
    callback: (data: T) => void,
  ): void {
    if (node) {
      // Process current node
      callback(node.data);
      // Recursively process all children
      node.children.forEach((child) => this.traverseDFSUtil(child, callback));
    }
  }

  /**
   * Traverses the tree in breadth-first order, calling the callback for each node
   * @param callback - Function to call for each node's data during traversal
   */
  traverseBFS(callback: (data: T) => void): void {
    if (!this.root) return;

    // Use a queue to process nodes level by level
    const queue: TreeNode<T>[] = [this.root];

    while (queue.length > 0) {
      const current = queue.shift()!; // Remove and get first node from queue
      callback(current.data); // Process current node
      queue.push(...current.children); // Add all children to queue
    }
  }

  /**
   * Prints a visual representation of the tree structure to console
   */
  print(): void {
    /**
     * Recursively prints a node and its children with proper indentation
     * @param node - The node to print
     * @param level - Current depth level for indentation
     */
    const printNode = (node: TreeNode<T> | null, level = 0): void => {
      if (!node) return;

      const indent = "  ".repeat(level); // Create indentation based on depth

      // Try to extract name property if it exists, otherwise use the data directly
      const displayValue = String((node.data as any).name ?? node.data);
      print(`${indent}- ${displayValue}`);

      // Recursively print all children with increased indentation
      node.children.forEach((child) => printNode(child, level + 1));
    };

    printNode(this.root);
  }
}
