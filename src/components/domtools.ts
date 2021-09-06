
export function getSelectionStartAndEndOffsets (): [number, number] | null {
  const range = window.getSelection()?.getRangeAt(0)
  if (!range) { return null }
  return [range.startOffset, range.endOffset]
}

export function isSelectionAtTheBeginning (): boolean {
  const range = window.getSelection()?.getRangeAt(0)
  if (!range) { return false }
  const node = range?.startContainer
  if (node.nodeType !== Node.TEXT_NODE) { return false }
  const isCollapsed = range.startOffset === range.endOffset
  // TODO: Should check if the node is displayed collapsing white space at the beginning.
  const isAtStart = (node as Text).data?.substring(0, range.startOffset).trim() === ''
  return isCollapsed && isAtStart
}
