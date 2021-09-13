// TODO: Be careful! This is a dict so it can be null.
// TODO: We need to abstract this to a default map ensuring it always return a list.
// eslint-disable-next-line no-use-before-define
export type SlotMap = { [key: string]: Hton[] }
export type AttrMap = { [key: string]: any }
export type TextNode = ['#t', string]
// eslint-disable-next-line no-use-before-define
export type TagNode = [string, Hton[], AttrMap?, SlotMap?]
export type Hton = TextNode | TagNode
export type HtonPath = string

// TODO: Considering text nodes as collections of "character nodes" may lead
// to a fully recursive structure and better generalization. This way,
// NodeOffset would not be neccessary since all the elements of the node,
// including characters should be addressable with an HTON path.
export interface TextNodeOffset {
  offset: number
  path: HtonPath
}

export const HTON_NAME = 0
export const HTON_CHILDREN = 1
export const HTON_TEXT = 1
export const HTON_ATTRS = 2
export const HTON_SLOTS = 3

export function newTextNode (text: string): TextNode {
  return ['#t', text]
}

export function getName (node: Hton): string {
  return node[HTON_NAME]
}

export function setName (node: Hton, name: string) {
  node[HTON_NAME] = name
}

export function getChildren (node: TagNode): Hton[] {
  return node[HTON_CHILDREN] ?? []
}

export function setChildren (node: TagNode, children: Hton[]) {
  node[HTON_CHILDREN] = children
}

export function getText (node: TextNode): string {
  return node[HTON_TEXT] ?? ''
}

export function setText (node: TextNode, text: string) {
  node[HTON_TEXT] = text
}

export function getAttrs (node: TagNode): AttrMap {
  return node[HTON_ATTRS] ?? {}
}

export function getAttribute (node: TagNode, name: string): any {
  return getAttrs(node)[name]
}

export function setAttribute (node: TagNode, name: string, value: any) {
  const attrs = getAttrs(node)
  attrs[name] = value
}

export function setAttrs (node: TagNode, attrs: AttrMap) {
  node[HTON_ATTRS] = attrs
}

export function getSlots (node: TagNode): SlotMap {
  return node[HTON_SLOTS] ?? {}
}

export function setSlots (node: TagNode, slots: SlotMap) {
  node[HTON_SLOTS] = slots
}

export function cloneNode<T extends Hton> (node: T): T {
  return JSON.parse(JSON.stringify(node))
}

export function isHton (node: any): node is Hton {
  return Array.isArray(node) && typeof node[0] === 'string'
}

export function isTagNode (node: Hton): node is TagNode {
  const name = getName(node)
  return name.charAt(0) !== '#'
}

export function isTextNode (node: Hton): node is TextNode {
  const name = getName(node)
  return name === '#t'
}

export function locateInNode (node: Hton, targetNode: Hton): HtonPath | null {
  if (isTextNode(node)) {
    throw new TypeError('Text node cannot have children.')
  }
  const pathBuilder = new PathBuilder()
  const childIndex = getChildren(node).indexOf(targetNode)
  if (childIndex >= 0) {
    return pathBuilder.child(childIndex).path
  }
  const slots = getSlots(node)
  for (const [slotName, children] of Object.entries(slots)) {
    const childIndex = children?.indexOf(targetNode)
    if (childIndex >= 0) {
      return pathBuilder.slotChild(slotName, childIndex).path
    }
  }
  return null
}

export function normalizeTextNodesInPlace (children: Hton[]) {
  // Indicate all the children up to this index are normalized
  let stillToNormalize = 0
  let lookahead = 1
  while (lookahead < children.length) {
    const nodeA = children[stillToNormalize]
    const nodeB = children[lookahead]
    // [xxx, tag, yyy, ...] -> [yyy, ...]
    if (isTagNode(nodeB)) {
      stillToNormalize = lookahead + 1
      lookahead = stillToNormalize + 1
    // [tag, text, yyy, ...] -> [text, yyy, ...]
    } else if (isTagNode(nodeA)) {
      stillToNormalize = lookahead
      lookahead = stillToNormalize + 1
    // [textA, textB, yyy, ...] -> [textA + textB, yyy, ...]
    } else {
      const textA = getText(nodeA)
      const textB = getText(nodeB)
      setText(nodeA, textA + textB)
      children.splice(lookahead, 1)
    }
  }
}

export class PathBuilder {
  static root = ''

  path: HtonPath

  constructor (path: HtonPath = PathBuilder.root) {
    this.path = path
  }

  child (index: number, { slotName }:{ slotName?: string | null } = { slotName: null }): this {
    if (slotName) {
      return this.slotChild(slotName, index)
    }
    const childPath = `#${HTON_CHILDREN}#${index}`
    this.path = joinPaths(this.path, childPath)
    return this
  }

  slotChild (slotName: string, index: number): this {
    const childPath = `#${HTON_SLOTS}#${slotName}#${index}`
    this.path = joinPaths(this.path, childPath)
    return this
  }
}

// eslint-disable-next-line no-use-before-define
interface IsRootPath<T extends Hton> extends PathInfo<T, null> {
  parent: null
  childIndex: null
  isRoot: () => true
}

// eslint-disable-next-line no-use-before-define
interface IsChildPath<T extends Hton, P extends TagNode> extends PathInfo<T, P> {
  // eslint-disable-next-line no-use-before-define
  parent: PathInfo<T, P>
  childIndex: number
  isRoot: () => false
}

// eslint-disable-next-line no-use-before-define
interface IsSlotChildPath<T extends Hton, P extends TagNode> extends IsChildPath<T, P> {
  isSlot: () => true
  slotName: string
}

export class PathInfo<T extends Hton, P extends TagNode | null> {
  path: HtonPath

  constructor (path: HtonPath) {
    this.path = path
  }

  get parent (): PathInfo<T, P> | null {
    if (this.isRoot()) {
      return null
    }
    return new PathInfo(joinPaths(
      ...splitPath(this.path).slice(0, -1)
    ))
  }

  get childIndex (): number | null {
    if (this.path === PathBuilder.root) { return null }
    const lastPath = splitPath(this.path).pop()
    if (!lastPath) {
      throw new TypeError(`Cannot extract sub-paths from ${this.path}`)
    }
    const privateLastFragment = splitPathFragment(lastPath).pop()
    if (!privateLastFragment) {
      throw new TypeError(`Cannot extract private fragments from ${this.path}`)
    }
    return parseInt(privateLastFragment, 10)
  }

  get slotName (): string | null {
    if (this.path === PathBuilder.root) { return null }
    const lastPath = splitPath(this.path).pop()
    if (!lastPath) {
      throw new TypeError(`Cannot extract sub-paths from ${this.path}`)
    }
    const privateFragments = splitPathFragment(lastPath)
    if (privateFragments.length !== 4) { return null }
    return privateFragments[2]
  }

  isSlot<PP extends TagNode> (): this is IsSlotChildPath<T, PP> {
    return this.slotName !== null
  }

  isEqual (path: HtonPath): boolean {
    return this.path === path
  }

  isRoot (): this is IsRootPath<T> {
    return this.isEqual(PathBuilder.root)
  }

  isChild<PP extends TagNode> (): this is IsChildPath<T, PP> {
    return this.parent !== null
  }

  static isHtonPath (path: HtonPath | TextNodeOffset | undefined): path is HtonPath {
    return typeof path === 'string'
  }
}

export type TransformedSlots<T> = Record<string, T[]>
export interface HtonVisitor<T> {
  visit (node: Hton, key?: HtonPath): T
  visitTextNode (node: TextNode, key: HtonPath): T
  visitTagNode (node: TagNode, key: HtonPath): T
  visitChildren (node: TagNode, key: HtonPath): T[]
  visitSlots (node: TagNode, key: HtonPath): TransformedSlots<T>
}
export abstract class HtonVisitorBase<T> implements HtonVisitor<T> {
  visit (node: Hton, key: HtonPath = PathBuilder.root): T {
    if (!Array.isArray(node)) {
      throw new TypeError(`node is of an invalid type (${typeof node}). HTON nodes are 4-element lists.`)
    }

    if ((node as any[]).length === 0 || node.length > 4) {
      throw new TypeError(`node is of an invalid length (${node.length}). HTON nodes are of the form [string, node[]?, object?, object?]`)
    }

    if (isTextNode(node)) {
      return this.visitTextNode(node, key)
    }

    return this.visitTagNode(node, key)
  }

  abstract visitTextNode (node: Hton, key: HtonPath): T

  abstract visitTagNode (node: Hton, key: HtonPath): T

  visitSlots (node: TagNode, key: HtonPath): TransformedSlots<T> {
    const slots = getSlots(node)
    const slotMap: TransformedSlots<T> = {}
    for (const [slotName, slotNodes] of Object.entries(slots)) {
      slotMap[slotName] =
        this.visitNodeList(
          slotNodes,
          index => new PathBuilder(key).slotChild(slotName, index).path
        )
    }
    return slotMap
  }

  visitChildren (node: TagNode, key: HtonPath): T[] {
    const children = getChildren(node)
    return this.visitNodeList(
      children,
      index => new PathBuilder(key).child(index).path
    )
  }

  visitNodeList (nodes: Hton[], getKey: (index: number) => HtonPath) {
    return nodes.map((oneNode, index) => {
      return this.visit(oneNode, getKey(index))
    })
  }
}

export function findInHton (path: HtonPath, hton: Hton): Hton | null {
  const pathList = splitPath(path)
  return _doFindInHton(pathList, hton)
}

export function pathNodes (path: HtonPath, node: Hton): [HtonPath, Hton][] {
  return splitPath(path).map((_, index, array) => {
    const subPath = joinPaths(...array.slice(0, index + 1))
    const child = findInHton(subPath, node)
    if (child === null) {
      throw new TypeError(`Path "${subPath}" does not lead to an HTON node`)
    }
    return [subPath, child]
  })
}

export function splitPath (path: HtonPath): HtonPath[] {
  return path.split('.')
}

function splitPathFragment (fragment: string): string[] {
  return fragment.split('#')
}

export function joinPaths (...paths: HtonPath[]): HtonPath {
  return paths.join('.')
}

function _doFindInHton (pathList: HtonPath[], node: Hton): Hton | null {
  if (pathList.length === 0) {
    return node
  }

  const privatePath = pathList[0] // TypeScript "!" indicates non-undefined
  const privateFragments = privatePath.split('#')
  let nextPrivateCollection: any = node
  while (nextPrivateCollection && privateFragments.length > 0) {
    const fragment = privateFragments.shift()
    if (fragment === '') { continue }
    nextPrivateCollection = fragment && nextPrivateCollection?.[fragment]
  }

  const nextNode = nextPrivateCollection
  return isHton(nextNode)
    ? _doFindInHton(pathList.slice(1), nextNode)
    : null
}

export interface HtonInspector {
  hton: Hton

  get (path: HtonPath): Hton

  getNodePath (args: { path: HtonPath }): Hton[]

  getName (args: { path: HtonPath }): string
}

export interface HtonMutator {
  setText (path: HtonPath, newValue: string): this

  setProperty (path: HtonPath, name: string, newValue: any): this

  removeNode (path: HtonPath): this

  changeNodePosition (path: HtonPath, position: number): this

  addChildren (path: HtonPath, position: number | 'start' | 'end', ...nodes: Hton[]): this

  addSlotChildren (path: HtonPath, slotName: string, position: number | 'start' | 'end', ...nodes: Hton[]): this

  wrapWithNode (wrapNode: Hton, start: HtonPath | TextNodeOffset, end: HtonPath | TextNodeOffset | undefined): this

  splitAt (splitNode: HtonPath | TextNodeOffset, ancestorLevel: number): this

  fuseBack (targetNode: HtonPath, ancestorLimit: number | null): this

  unwrapContent (path: HtonPath): this

  emit (eventType: string, data: Record<any, any>): void

  on (eventType: string, handler: CallableFunction): void
}

// TODO: Should it be an inmutable version with all modifications producing new
// copies of the HTON? I think that would make the mutator easier to reason with
// and prevent some errors.

export class InplaceMutator implements HtonMutator, HtonInspector {
  hton: Hton

  _handlers: Record<string, CallableFunction[]>

  constructor (hton: Hton) {
    this.hton = hton
    this._handlers = {}
  }

  setText (path: HtonPath, newValue: string): this {
    const node = this.get(path)
    if (!isTextNode(node)) {
      throw new TypeError(`HTON node [${getName(node)}, ...] is not a text node.`)
    }
    const currentValue = getText(node)
    if (currentValue !== newValue) {
      setText(node, newValue)
      this.emit('hton-updated', { path })
    }
    return this
  }

  setProperty (path: HtonPath, name: string, newValue: any): this {
    const node = this.get(path)
    if (!isTagNode(node)) {
      throw new TypeError(
        `HTON node [${getName(node)}, ...] is not a tag node and so, it does not have properties.`)
    }
    const currentValue = getAttribute(node, name)
    if (currentValue !== newValue) {
      setAttribute(node, name, newValue)
      this.emit('hton-updated', { path })
    }
    return this
  }

  removeNode (path: HtonPath): this {
    const pathInfo = new PathInfo(path)
    if (pathInfo.isRoot()) {
      throw new TypeError('Removing the root node is impossible.')
    } else if (pathInfo.isChild()) {
      const slotName = pathInfo.slotName
      const parentPath = pathInfo.parent.path
      const childIndex = pathInfo.childIndex
      const parentNode = this.get(parentPath)
      if (!isTagNode(parentNode)) {
        throw new TypeError(`Unreachable. Parent node [${getName(parentNode)}, ...] must be a tag node.`)
      }
      const children = slotName
        ? getSlots(parentNode)[slotName]
        : getChildren(parentNode)
      children.splice(childIndex!, 1)
      this.emit('hton-updated', { path: parentPath })
    }
    return this
  }

  changeNodePosition (path: HtonPath, position: number): this {
    const pathInfo = new PathInfo(path)
    if (pathInfo.isRoot()) {
      throw new TypeError('Changing the position of the root node is impossible.')
    } else if (pathInfo.isChild()) {
      const slotName = pathInfo.slotName
      const parentPath = pathInfo.parent.path
      const childIndex = pathInfo.childIndex
      if (childIndex === null) {
        throw new TypeError('No child index for this node. Removing the root node is impossible.')
      }
      const parentNode = this.get(parentPath)
      if (!isTagNode(parentNode)) {
        throw new TypeError(`Not possible. Parent node [${getName(parentNode)}, ...] must be a tag node.`)
      }
      const children = slotName
        ? getSlots(parentNode)[slotName]
        : getChildren(parentNode)
      position = clamp(position, 0, children.length - 1)
      if (position !== childIndex) {
        const node = children.splice(childIndex, 1)[0]
        children.splice(position, 0, node)
        const newPath = slotName
          ? new PathBuilder(parentPath).slotChild(slotName, position)
          : new PathBuilder(parentPath).child(position)
        this.emit('hton-updated', { parentPath, path: newPath })
      }
    }
    return this
  }

  addChildren (path: HtonPath, position: number | 'start' | 'end', ...nodes: Hton[]): this {
    const parentNode = this.get(path)
    if (isTextNode(parentNode)) {
      throw new TypeError(`Node [${getName(parentNode)} is a text node and text nodes have not children.`)
    }
    const children = getChildren(parentNode)
    position = clamp(position, 0, children.length)
    children.splice(position, 0, ...nodes)
    this.emit('hton-updated', { path })
    return this
  }

  addSlotChildren (path: HtonPath, slotName: string, position: number | 'start' | 'end', ...nodes: Hton[]): this {
    const parentNode = this.get(path)
    if (isTextNode(parentNode)) {
      throw new TypeError(`Node [${getName(parentNode)} is a text node and text nodes have not slots.`)
    }
    const children = getSlots(parentNode)[slotName]
    position = clamp(position, 0, children.length)
    children.splice(position, 0, ...nodes)
    this.emit('hton-updated', { path })
    return this
  }

  splitAt (splitNodePath: HtonPath | TextNodeOffset, ancestorLevel: number): this {
    const nodePath = PathInfo.isHtonPath(splitNodePath) ? splitNodePath : splitNodePath.path
    const pathInfo = new PathInfo(nodePath)
    if (pathInfo.isRoot()) {
      throw new TypeError('Splitting the root node is not possible.')
    } else if (pathInfo.isChild()) {
      const splitMode = PathInfo.isHtonPath(splitNodePath) ? 'node' : 'text'
      const splitNode = this.get(nodePath)
      if (isTextNode(splitNode) && splitMode === 'text') {
        const textNode = splitNode
        const textNodePath = nodePath
        const textBeforeSplitPoint = getText(textNode).substring(0, (splitNodePath as TextNodeOffset).offset)
        const textAfterSplitPoint = getText(textNode).substring((splitNodePath as TextNodeOffset).offset)
        const tailTextNode = cloneNode(textNode)
        setText(textNode, textBeforeSplitPoint)
        setText(tailTextNode, textAfterSplitPoint)
        const tailTextPath = this._addSibling(textNodePath, tailTextNode)
        const newPath = this._doSplitAt(tailTextPath, ancestorLevel)
        this.emit('hton-updated', { path: newPath })
      } else if (isTagNode(splitNode) && splitMode === 'node') {
        const newPath = this._doSplitAt(nodePath, ancestorLevel)
        this.emit('hton-updated', { path: newPath })
      }
    }
    return this
  }

  // TODO: Review the role or name of ancestorLevel. Splitting at 0 should do something, I think.
  // TODO: Maybe it makes more sense saying split ANCESTOR at DESCENDANT.
  // TODO: Something like _doSplitAt(ancestor: HtonPath, descendant: HtonPath)
  // TODO: But I must ensure the descendant is really a descendant of ancestor. So,
  // it is better to set the descendant and the levels of ascentors above. The thing
  // is that you always split at, at least, one level above, even for text.
  _doSplitAt (splitNodePath: HtonPath, ancestorLevel: number): HtonPath {
    const pathInfo = new PathInfo(splitNodePath)
    if (pathInfo.isRoot()) {
      throw new TypeError('Splitting on the root node is not possible.')
    } else if (pathInfo.isChild()) {
      if (ancestorLevel === 0) {
        return splitNodePath
      }
      const parentPath = pathInfo.parent.path
      const parentNode = this.get(parentPath) as TagNode
      const siblings = this._getSiblings(splitNodePath)
      const tailSiblings = siblings.splice(pathInfo.childIndex, siblings.length - pathInfo.childIndex)
      const parentTailDuplicate = cloneNode(parentNode)
      setChildren(parentTailDuplicate, tailSiblings)
      const parentSiblingPath = this._addSibling(parentPath, parentTailDuplicate)
      return this._doSplitAt(parentSiblingPath, ancestorLevel - 1)
    }
    throw new TypeError('Unreachable. The split path must be either the root or a child.')
  }

  _getSiblings (path: HtonPath): Hton[] {
    const pathInfo = new PathInfo(path)
    if (pathInfo.isRoot()) {
      throw new TypeError('The root path has no siblings.')
    } else if (pathInfo.isChild()) {
      const parentPath = pathInfo.parent.path
      const parentNode = this.get(parentPath) as TagNode
      const slotName = pathInfo.slotName
      const siblings = slotName
        ? getSlots(parentNode)[slotName]
        : getChildren(parentNode)
      return siblings
    }
    throw new TypeError('Unreachable. The path must be either the root or a child.')
  }

  _addSibling (path: HtonPath, node: Hton): HtonPath {
    const pathInfo = new PathInfo(path)
    if (pathInfo.isRoot()) {
      throw new TypeError('Cannot add a sibling to the root node.')
    } else if (pathInfo.isChild()) {
      const parentPath = pathInfo.parent
      const siblings = this._getSiblings(path)
      const siblingIndex = pathInfo.childIndex + 1
      siblings.splice(siblingIndex, 0, node)
      const siblingPath = new PathBuilder(parentPath.path)
      if (pathInfo.isSlot()) {
        const slotName = pathInfo.slotName
        siblingPath.slotChild(slotName, siblingIndex)
      } else {
        siblingPath.child(siblingIndex)
      }
      return siblingPath.path
    }
    throw new TypeError('Unreachable. The path must be either the root or a child.')
  }

  fuseBack (path: HtonPath, ancestorLimit: number | null): this {
    const pathInfo = new PathInfo(path)
    if (pathInfo.isRoot()) {
      throw new TypeError('Cannot fuse back the root node. There is nothing to fuse back with')
    } else if (pathInfo.isChild()) {
      const isBigBrother = pathInfo.childIndex === 0
      if (isBigBrother) {
        if (ancestorLimit === null || ancestorLimit > 0) {
          const newLimit = ancestorLimit === null
            ? null
            : ancestorLimit - 1
          return this.fuseBack(pathInfo.parent.path, newLimit)
        } else {
          return this
        }
      }

      const targetNode = this.get(path)
      const bigBrotherPath = new PathBuilder(pathInfo.parent.path)
        .child(pathInfo.childIndex - 1, { slotName: pathInfo.slotName })
        .path
      const bigBrotherNode = this.get(bigBrotherPath)

      this._extendNode(bigBrotherNode, targetNode)
      this.removeNode(path)

      this.emit('hton-updated', { path: bigBrotherPath })
    }
    return this
  }

  _extendNode (targetNode: Hton, sourceNode: Hton): void {
    if (getName(targetNode) !== getName(sourceNode)) {
      throw new TypeError(
        `Cannot extend a node with another of a different type (trying to extend ${getName(targetNode)} with ${getName(sourceNode)}).`
      )
    }
    if (isTextNode(targetNode) && isTextNode(sourceNode)) {
      setText(targetNode, getText(targetNode) + getText(sourceNode))
    } else if (isTagNode(targetNode) && isTagNode(sourceNode)) {
      this._extendChildren(targetNode, sourceNode)
      this._extendSlots(targetNode, sourceNode)
    } else {
      throw new TypeError('Unreachable. If nodes have the same name, they must be of the same type.')
    }
  }

  _extendChildren (targetNode: TagNode, sourceNode: TagNode): void {
    const targetChildren = getChildren(targetNode)
    const sourceChildren = getChildren(sourceNode)
    targetChildren.push(...sourceChildren)
    normalizeTextNodesInPlace(targetChildren)
    setChildren(targetNode, targetChildren)
  }

  _extendSlots (targetNode: TagNode, sourceNode: TagNode): void {
    const targetSlots = getSlots(targetNode)
    const sourceSlots = getSlots(sourceNode)
    Object.assign(targetSlots, sourceSlots)
    Object.values(sourceSlots).forEach((slotValue) => {
      normalizeTextNodesInPlace(slotValue)
    })
    setSlots(targetNode, targetSlots)
  }

  wrapWithNode (wrapNode: Hton, start: HtonPath | TextNodeOffset, end: HtonPath | TextNodeOffset | undefined): this {
    const startPath = PathInfo.isHtonPath(start) ? start : start.path
    const endPath = PathInfo.isHtonPath(end) ? end : end?.path
    const areEqual = !endPath || new PathInfo(startPath).isEqual(endPath)
    const wrapMode = typeof endPath === 'undefined' ? 'node' : 'text'
    if (!areEqual) {
      throw new TypeError(
        'Wrapping ranges going throw different parent nodes is not yet supported')
    }
    if (wrapMode === 'node' && typeof start !== 'string') {
      throw new TypeError(
        'When ommitting `end` parameter to wrap a node, `start` parameter must be an HTON path')
    }
    if (wrapMode === 'text') {
      const textNode = this.get(startPath)
      if (!isTextNode(textNode)) {
        throw new TypeError(
          'If wrapping around a text selection, `start` and `end` paths should ' +
          'be the same text node'
        )
      }
      if (isTextNode(wrapNode)) {
        throw new TypeError(
          'The wrap note cannot be a TextNode because TextNode instances cannot ' +
          'have children'
        )
      }
      if (typeof start === 'string' || !end || typeof end === 'string') {
        throw new TypeError(
          'If wrapping around a text selection, `start` and `end` should be ' +
          'instances of TextNodeOffset'
        )
      }
      // Split text content into three text nodes and wrap the one with the target text.
      const text = getText(textNode)
      const prefix = newTextNode(text.substring(0, start.offset))
      const suffix = newTextNode(text.substring(end.offset))
      const target = newTextNode(text.substring(start.offset, end.offset))
      const wrappedTarget = new InplaceMutator(wrapNode)
        .addChildren(PathBuilder.root, 'start', target)
        .hton
      const newChildren = [prefix, wrappedTarget, suffix]

      // Replace the text node with the triplet of nodes.
      const pathInfo = new PathInfo(startPath)
      if (pathInfo.isRoot()) {
        throw new TypeError('Cannot wrap the root node.')
      } else if (pathInfo.isChild()) {
        const parentPath = pathInfo.parent.path
        const parentNode = this.get(parentPath) as TagNode
        const relativePath = new PathInfo(locateInNode(parentNode, textNode) as HtonPath)
        const index = relativePath.childIndex as number
        if (relativePath.isSlot()) {
          const slotName = relativePath.slotName
          new InplaceMutator(parentNode)
            .removeNode(new PathBuilder().slotChild(slotName, index).path)
            .addSlotChildren(PathBuilder.root, slotName, index, ...newChildren)
        } else {
          new InplaceMutator(parentNode)
            .removeNode(new PathBuilder().child(index).path)
            .addChildren(PathBuilder.root, index, ...newChildren)
        }

        const wrappedTargetPath = new PathBuilder(parentPath).child(index + 1)
        this.emit('hton-updated', { path: wrappedTargetPath.path })
      }
    } else {
      // Wrap the target
      const targetNode = this.get(startPath)
      const wrappedTarget = new InplaceMutator(wrapNode)
        .addChildren(PathBuilder.root, 'start', targetNode)
        .hton

      // Replace the target with the wrapped target
      const pathInfo = new PathInfo(startPath)
      if (pathInfo.isRoot()) {
        throw new TypeError('Cannot wrap the root node.')
      } else if (pathInfo.isChild()) {
        const parentPath = pathInfo.parent.path
        const parentNode = this.get(parentPath) as TagNode
        const relativePath = new PathInfo(locateInNode(parentNode, targetNode) as HtonPath)
        const index = relativePath.childIndex as number
        if (relativePath.isSlot()) {
          const slotName = relativePath.slotName
          new InplaceMutator(parentNode)
            .removeNode(new PathBuilder().slotChild(slotName, index).path)
            .addSlotChildren(PathBuilder.root, slotName, index, wrappedTarget)
        } else {
          new InplaceMutator(parentNode)
            .removeNode(new PathBuilder().child(index).path)
            .addChildren(PathBuilder.root, index, wrappedTarget)
        }
        const wrappedTargetPath = new PathBuilder(parentPath).child(index)
        this.emit('hton-updated', { path: wrappedTargetPath.path })
      }
    }
    return this
  }

  unwrapContent (path: HtonPath): this {
    const pathInfo = new PathInfo(path)
    if (pathInfo.isRoot()) {
      throw new TypeError('Cannot unwrap the content of the root node')
    } else if (pathInfo.isChild()) {
      const targetNode = this.get(path)
      if (isTextNode(targetNode)) {
        throw new TypeError('Cannot unwrap the content of a text node')
      }
      const children = getChildren(targetNode)
      const parentPath = pathInfo.parent.path
      const parentNode = this.get(parentPath) as TagNode
      const relativePath = new PathInfo(locateInNode(parentNode, targetNode) as HtonPath)
      const index = relativePath.childIndex as number
      if (relativePath.isSlot()) {
        const slotName = relativePath.slotName
        new InplaceMutator(parentNode)
          .removeNode(new PathBuilder().slotChild(slotName, index).path)
          .addSlotChildren(PathBuilder.root, slotName, index, ...children)
        normalizeTextNodesInPlace(getSlots(parentNode)[slotName])
      } else {
        new InplaceMutator(parentNode)
          .removeNode(new PathBuilder().child(index).path)
          .addChildren(PathBuilder.root, index, ...children)
        normalizeTextNodesInPlace(getChildren(parentNode))
      }
      this.emit('hton-updated', { path })
    }
    return this
  }

  get (path: HtonPath): Hton {
    const node = findInHton(path, this.hton)
    if (node === null) {
      throw new TypeError(`HTON node not found at "${path}"`)
    }
    return node
  }

  getNodePath ({ path = PathBuilder.root }): Hton[] {
    return this._doGetNodePath(new PathInfo(path))
  }

  getName ({ path = PathBuilder.root }): string {
    return getName(this.get(path))
  }

  // TODO: Generalize the mutator and the inspector (OMG!)
  _doGetNodePath (pathInfo: PathInfo<Hton, TagNode> | null): Hton[] {
    const nodePath = []
    let currentPathInfo = pathInfo
    while (currentPathInfo !== null) {
      nodePath.unshift(this.get(currentPathInfo.path))
      currentPathInfo = currentPathInfo.parent
    }
    return nodePath
  }

  emit (eventType: string, data: Record<any, any>) {
    const handlers = this._handlers[eventType] ?? []
    handlers.forEach((handler: CallableFunction) => handler(data))
  }

  on (eventType: string, handler: CallableFunction) {
    if (!(eventType in this._handlers)) {
      this._handlers[eventType] = []
    }
    this._handlers[eventType].push(handler)
  }
}

function clamp (value: number | 'start' | 'end', min: number, max: number): number {
  const numericValue = typeof value === 'string'
    ? { start: 0, end: max }[value]
    : value
  return Math.max(min, Math.min(numericValue, max))
}
