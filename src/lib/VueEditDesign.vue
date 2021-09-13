<script lang="ts">
import Vue, { CreateElement, VNode, PropType } from 'vue'
import { ScopedSlot } from 'vue/types/vnode'
import Consola from 'consola'
import { HtonMutator, HtonInspector, PathBuilder, findInHton, getAttrs, getChildren, getName, getSlots, getText, Hton, HtonPath, HtonVisitorBase, isTextNode, InplaceMutator, pathNodes, TagNode, TextNode, TextNodeOffset, cloneNode } from './hton'

import { ComponentRegistry } from './VueEditRender.vue'
import VueEditDesignToolbox, { ChildView, NewNodeEvent, NodePositionChangeEvent, UnwrapEvent, WrapNodeEvent } from './VueEditDesignToolbox.vue'
import { getSelectionStartAndEndOffsets, isSelectionAtTheBeginning } from './domtools'

const COMPONENT_NAME = 'vue-edit-design'
const DATA_KEY = `data-${COMPONENT_NAME}-key`
const PROP_EDIT_MODE = 'in-edit-mode'
const CLASS_TEXT_PROXY = `${COMPONENT_NAME}__text-proxy`
const CLASS_SELECTED = `${COMPONENT_NAME}__selected`

/**
 * Transform a HTON tree into a hierarchy of Vue components.
 *
 * HTON stands for Hyper Text Object Notation and is inspired by the JSON flavor
 * of the HyperPython specification, HyperJSON:
 * https://hyperpython.readthedocs.io/en/latest/hyperjson.html
 *
 * HTON nodes are 4-element tuples of the form:
 * `[<tagname>, <children list> | <text content>, <attribute map>, <slot map>]`
 *
 * The children list, and attribute and slot maps are optional.
 *
 * An HTON node like:
 * ```
 * [
 *   'app-header',
 *   [ ['#t', 'This is the header'] ],
 *   { class: 'theme-dark' },
 *   {
 *     subtitle: [ ['strong', ['#t', 'Some subtitle']] ]
 *   }
 * ]
 * ```
 *
 * Translates into:
 * ```
 * <app-header class="theme-dark">
 *   This is the header
 *   <template name="subtitle">
 *     <strong>Some subtitle</strong>
 *   </template>
 * </app-header>
 * ```
 */
function htonToVirtualDom (h: CreateElement, node: Hton, registry: ComponentRegistry, ne: any) {
  const visitor = new VDomDesignBuilder(
    h,
    registry,
    ne.onTextProxyEvent.bind(ne)
  )
  return visitor.visit(node)
}

type EventHandler = (event: UIEvent) => any

class VDomDesignBuilder extends HtonVisitorBase<VNode> {
  createElement: CreateElement

  componentLibrary: ComponentRegistry

  onTextProxyEvent: EventHandler

  constructor (createElement: CreateElement, componentLibrary: ComponentRegistry, onTextProxyEvent: EventHandler) {
    super()
    this.createElement = createElement
    this.componentLibrary = componentLibrary
    this.onTextProxyEvent = onTextProxyEvent
  }

  visitTextNode (node: TextNode, key: HtonPath) {
    const text = getText(node)
    return this.createElement('span', {
      ref: key,
      attrs: { [DATA_KEY]: key, contenteditable: true, [PROP_EDIT_MODE]: true },
      class: [CLASS_TEXT_PROXY],
      on: {
        focusout: this.onTextProxyEvent,
        beforeinput: this.onTextProxyEvent
      }
    }, text)
  }

  visitTagNode (node: TagNode, key: HtonPath) {
    const slots = this.visitSlots(node, key)
    const scopedSlots: Record<string, ScopedSlot | undefined> = {}
    for (const [slotName, vChildren] of Object.entries(slots)) {
      scopedSlots[slotName] = function () { return vChildren }
    }

    const name = getName(node)
    const attrs = {
      ...getAttrs(node),
      [DATA_KEY]: key,
      [PROP_EDIT_MODE]: true
    }
    const vNode = this.componentLibrary[name] ?? name
    return this.createElement(vNode, {
      ref: key,
      attrs,
      props: attrs,
      scopedSlots
    }, this.visitChildren(node, key))
  }
}

type VueEditDesignData = Record<any, any> & {
  htonNodeSelected: HtonPath | null
}

type PropertyChangeRequest = {
  path: HtonPath,
  name: string,
  value: any
}

interface DesignRules {
  insertParagraph?: string[]
  newElementTemplates?: Record<string, Hton>
}

export default Vue.extend({
  name: COMPONENT_NAME,
  components: {
    VueEditDesignToolbox
  },
  props: {
    hton: {
      type: Array as any as PropType<Hton>,
      required: false,
      default () { return null }
    },
    components: {
      type: Object,
      required: false,
      default () { return {} }
    },
    tag: {
      type: String,
      default: 'div'
    },
    rules: {
      type: Object as PropType<DesignRules>,
      required: false,
      default () { return {} }
    }
  },
  data (): VueEditDesignData {
    return {
      htonNodeSelected: null
    }
  },
  computed: {
    _inplaceMutator (): InplaceMutator {
      const inplaceMutator = new InplaceMutator(this.hton)
      inplaceMutator.on(
        'hton-updated',
        ({ path }: { path: string }) => this.$emit(
          'hton-updated',
          { hton: inplaceMutator.hton, path }
        )
      )
      return inplaceMutator
    },
    mutator (): HtonMutator {
      return this._inplaceMutator
    },
    inspector (): HtonInspector {
      return this._inplaceMutator
    },
    selectionNodeType (): 'text' | 'tag' | null {
      if (this.htonNodeSelected === null) { return null }
      const node = findInHton(this.htonNodeSelected, this.hton)
      if (node === null) { return null }
      return isTextNode(node)
        ? 'text'
        : 'tag'
    },
    selectionPathNodeViews (): ChildView[] {
      if (this.htonNodeSelected === null) { return [] }
      const nodes = pathNodes(this.htonNodeSelected, this.hton)
      return nodes
        .map(([path, node]) => ({
          name: getName(node),
          path
        }))
    },
    selectionProperties (): Record<string, any>[] {
      if (this.htonNodeSelected === null) { return [] }
      const node = findInHton(this.htonNodeSelected, this.hton)
      if (node === null || isTextNode(node)) { return [] }
      return Object
        .entries(getAttrs(node))
        .map(([name, value]) => ({ name, value }))
    },
    selectionChildren (): ChildView[] {
      const { htonNodeSelected } = this
      if (htonNodeSelected === null) { return [] }
      const node = findInHton(htonNodeSelected, this.hton)
      if (node === null || isTextNode(node)) { return [] }
      const children = getChildren(node)
      return children
        .map((child, index) => ({
          name: getName(child),
          index,
          path: new PathBuilder(htonNodeSelected).child(index).path
        }))
    },
    selectionSlots (): Record<string, ChildView[]> {
      const { htonNodeSelected } = this
      if (htonNodeSelected === null) { return {} }
      const node = findInHton(htonNodeSelected, this.hton)
      if (node === null || isTextNode(node)) { return {} }
      const slots = getSlots(node)
      return Object.fromEntries(
        Object
          .entries(slots)
          .map(([name, children]) => [
            name,
            children
              .map((child, index) => ({
                name: getName(child),
                index,
                path: new PathBuilder(htonNodeSelected).slotChild(name, index).path
              }))
          ])
      )
    }
  },
  mounted () {
    const existingToolboxSpacer = document.querySelector('.vue-edit-design_toolbox-spacer')
    if (!existingToolboxSpacer) {
      const toolboxSpacer = document.createElement('div')
      toolboxSpacer.classList.add('vue-edit-design__toolbox-spacer')
      document.body.appendChild(toolboxSpacer)
    }
  },
  beforeDestroy () {
    const existingToolboxSpacer = document.querySelector('.vue-edit-design__toolbox-spacer')
    if (existingToolboxSpacer) {
      existingToolboxSpacer.parentElement!.removeChild(existingToolboxSpacer)
    }
  },
  methods: {
    onTextProxyEvent (event: Event) {
      if (event.type === 'focusout') {
        this.onFocusOut(event as UIEvent)
      }
      if (event.type === 'beforeinput') {
        this.onBeforeInput(event as InputEvent)
      }
    },
    onFocusOut (event: UIEvent) {
      const target = event.target
      if (target === null || !(target instanceof Element)) {
        Consola.error('No text proxy HTML element around editable text node.')
        return
      }
      const textContent = target.textContent ?? ''
      const path = target.getAttribute(DATA_KEY)
      this.updateText(path, textContent)
    },
    onBeforeInput (event: InputEvent) {
      if (event.inputType === 'insertParagraph') {
        return this.handleInsertParagraph(event)
      }
      if (event.inputType === 'deleteContentBackward') {
        return this.handleDeleteContentBackward(event)
      }
    },
    handleInsertParagraph (event: InputEvent) {
      const selection = getSelectionStartAndEndOffsets()
      if (selection === null || this.htonNodeSelected === null) { return }
      const endOffset = selection[1]
      const target: TextNodeOffset = {
        path: this.htonNodeSelected,
        offset: endOffset
      }
      const splitLevel = this.getSplitLevel(this.htonNodeSelected)
      if (splitLevel) {
        this.mutator.splitAt(target, splitLevel)
      }
      event.preventDefault()
    },
    handleDeleteContentBackward (event: InputEvent) {
      if (this.htonNodeSelected === null) { return }
      const selectionAtTheBeginning = isSelectionAtTheBeginning()
      if (!selectionAtTheBeginning) { return }
      this.mutator.fuseBack(this.htonNodeSelected, 1)
      event.preventDefault()
    },
    getSplitLevel (path: HtonPath): number | null {
      const DEFAULT = ['p']
      const nodePath = this.inspector.getNodePath({ path })
      const definition = (this.rules?.insertParagraph ?? DEFAULT)
      const options = new Set(definition)

      const nodeAndIndex = nodePath
        .slice()
        .reverse()
        .map((node, idx) => [node, idx] as [Hton, number])
        .find(([node]) => options.has(getName(node)))

      return nodeAndIndex?.[1] ?? null
    },
    onClick (event: PointerEvent) {
      const target = event.target
      if (target === null || !(target instanceof Element)) {
        Consola.error('No target element for click event.')
        return
      }
      if (this.isClickOnToolbox(target)) { return }
      const htonTarget = this.getHtonNodeElement(target)
      this.setSelected(htonTarget)
    },
    isClickOnToolbox (target: Element | null): boolean {
      if (target === null) { return false }
      const toolboxElement = (this.$refs.toolbox as Vue).$el
      return toolboxElement === target
        ? true
        : this.isClickOnToolbox(target.parentElement)
    },
    onPropertyChange (event: PropertyChangeRequest) {
      const { path, name, value } = event
      this.mutator.setProperty(path, name, value)
    },
    onSelectionChange (path: HtonPath) {
      const htonTarget = this.$el.querySelector(`[${DATA_KEY}="${path}"]`)
      if (htonTarget === null) {
        Consola.error(`No node with HTON path "${path}" found.`)
        return
      }
      this.setSelected(htonTarget)
    },
    onNodeRemoval (path: HtonPath) {
      this.mutator.removeNode(path)
    },
    onNodePositionChange ({ path, index }: NodePositionChangeEvent) {
      this.mutator.changeNodePosition(path, index)
    },
    onNewNode ({ path, index, slotName, nodeName }: NewNodeEvent) {
      const newNode = this.nodeFromNodeName(nodeName)
      if (!slotName) {
        this.mutator.addChildren(path, index, newNode)
      } else {
        this.mutator.addSlotChildren(path, slotName, index, newNode)
      }
    },
    onWrap ({ nodeName, start, end }: WrapNodeEvent) {
      const newNode = this.nodeFromNodeName(nodeName, { forceEmpty: true })
      try {
        this.mutator.wrapWithNode(newNode, start, end)
      } catch (ex) {
        Consola.error('Cannot wrap the range:', ex)
      }
    },
    onUnwrap ({ path }: UnwrapEvent) {
      try {
        this.mutator.unwrapContent(path)
        this.htonNodeSelected = ''
      } catch (ex) {
        Consola.error(`Cannot remove node at \`${path}\`:`, ex)
      }
    },
    nodeFromNodeName (nodeName: string, { forceEmpty }: {forceEmpty?: boolean } = {}): Hton {
      const newNode = this._nodeFromTemplate(nodeName)
      // TODO: defaulting in adding a text node is not ideal.
      const children = (forceEmpty ? [] : [['#t', 'Lorem ipsum dolor sit amet.']] as Hton[])
      return newNode || [nodeName, children]
    },
    _nodeFromTemplate (nodeName: string): Hton | null {
      const DEFAULT = {
        '#t': ['#t', 'Lorem ipsum dolor sit amet.']
      }
      const templates = Object.assign(DEFAULT, this.rules.newElementTemplates ?? {})
      const template = templates[nodeName]
      return template ? cloneNode(template) : null
    },
    setSelected (node: Element | string | null) {
      this.clearSelected()
      if (typeof node === 'string') {
        node = this.$root.$el.querySelector(`[${DATA_KEY}="${node}"]`)
      }
      if (node === null) { return }
      node.classList.add(CLASS_SELECTED)
      node.scrollTo()
      this.htonNodeSelected = node.getAttribute(DATA_KEY)
    },
    clearSelected () {
      document
        .querySelector(`.${CLASS_SELECTED}`)
        ?.classList
        .remove(CLASS_SELECTED)
      this.htonNodeSelected = null
    },
    getHtonNodeElement (node: Element | null): Element | null {
      if (node === null) { return null }
      return node.hasAttribute(DATA_KEY)
        ? node
        : this.getHtonNodeElement(node.parentElement)
    },
    updateText (path: any, text: string) {
      this.mutator.setText(path, text)
    }
  },
  render (createElement): VNode {
    const { hton, components, tag } = this.$props
    Consola.log('In DESIGN MODE')
    const start = performance.now()
    const vroot = hton && htonToVirtualDom(createElement, hton, components, this)
    Consola.log('Render done in', performance.now() - start, 'ms')
    const toolbox = createElement(
      VueEditDesignToolbox,
      {
        ref: 'toolbox',
        props: {
          'selection-path': this.htonNodeSelected,
          'selection-type': this.selectionNodeType,
          'selection-path-nodes': this.selectionPathNodeViews,
          'selection-properties': this.selectionProperties,
          'selection-children': this.selectionChildren,
          'selection-slots': this.selectionSlots
        },
        class: ['vue-edit-design__toolbox'],
        on: {
          'property-change': this.onPropertyChange,
          'selection-change': this.onSelectionChange,
          'node-removal': this.onNodeRemoval,
          'node-position-change': this.onNodePositionChange,
          'new-node': this.onNewNode,
          wrap: this.onWrap,
          unwrap: this.onUnwrap
        }
      }
    )
    // TODO: Split into two components to separate the toolbox from the render
    const children = [toolbox]
    vroot && children.unshift(vroot)
    return createElement(tag,
      { on: { '!click': this.onClick } },
      children
    )
  }
})
</script>

<style lang="scss">
:root {
  --vue-edit-toolbox-height: 40vh;
}

.vue-edit-design__toolbox-spacer {
  height: var(--vue-edit-toolbox-height);
}

.vue-edit-design__text-proxy {
  outline: rgb(180, 228, 206) 1.5px dotted;
}

[data-vue-edit-design-key]:not(.vue-edit-design__text-proxy) {
  outline: rgb(180, 228, 206) 1px solid;

  &.vue-edit-design__selected {
    outline: #4fc08d 4px solid;
  }

  &:hover:not(&.vue-edit-design__selected) {
    outline-width: 2px;
  }
}

</style>
