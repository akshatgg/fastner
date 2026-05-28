import type { CategoryTreeNode } from "./types";

/** Find a node by id, returning it together with its ancestor trail (root → node). */
export function findWithTrail(
  nodes: CategoryTreeNode[],
  id: string,
  trail: CategoryTreeNode[] = [],
): { node: CategoryTreeNode; trail: CategoryTreeNode[] } | null {
  for (const n of nodes) {
    const here = [...trail, n];
    if (n.id === id) return { node: n, trail: here };
    const found = findWithTrail(n.children, id, here);
    if (found) return found;
  }
  return null;
}

/** Flatten the tree to the list of leaf categories (where products can live),
 *  each labelled with its full path of names for display. */
export function leafCategories(
  nodes: CategoryTreeNode[],
  trail: string[] = [],
): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const n of nodes) {
    const here = [...trail, n.name];
    if (n.children.length === 0) {
      out.push({ id: n.id, label: here.join(" › ") });
    } else {
      out.push(...leafCategories(n.children, here));
    }
  }
  return out;
}
