export function flattenTree(node, acc = []) {
  acc.push(node)
  for (const filho of node.filhos ?? []) flattenTree(filho, acc)
  return acc
}

export function findPoliticoById(node, id) {
  if (node.id === id) return node
  for (const filho of node.filhos ?? []) {
    const found = findPoliticoById(filho, id)
    if (found) return found
  }
  return null
}
