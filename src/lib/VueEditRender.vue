
<script lang="ts">
import Vue, { CreateElement, VNode } from "vue";
import { ScopedSlot } from "vue/types/vnode";
import Consola from "consola";
import {
  getAttrs,
  getName,
  getText,
  Hton,
  HtonPath,
  HtonVisitorBase,
  TagNode,
  TextNode,
} from "./hton";

const COMPONENT_NAME = "vue-edit-render";

export type ComponentRegistry = {
  [key: string]: Parameters<CreateElement>[0];
};

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
function htonToVirtualDom(
  h: CreateElement,
  node: Hton,
  registry: ComponentRegistry
) {
  const builder = new VDomBuilder(h, registry);
  return builder.visit(node);
}

export class VDomBuilder extends HtonVisitorBase<VNode | string> {
  createElement: CreateElement;

  componentRegitry: ComponentRegistry;

  constructor(createElement: any, componentRegitry: any) {
    super();
    this.createElement = createElement;
    this.componentRegitry = componentRegitry;
  }

  visitTextNode(node: TextNode, _key: HtonPath) {
    return getText(node);
  }

  visitTagNode(node: TagNode, key: HtonPath) {
    const slots = this.visitSlots(node, key);
    const scopedSlots: { [key: string]: ScopedSlot | undefined } = {};
    for (const [slotName, vChildren] of Object.entries(slots)) {
      scopedSlots[slotName] = function () {
        return vChildren;
      };
    }

    const name = getName(node);
    const attrs = getAttrs(node);
    const vNode = this.componentRegitry[name] ?? name;
    return this.createElement(
      vNode,
      {
        attrs,
        props: attrs,
        scopedSlots,
      },
      this.visitChildren(node, key)
    );
  }
}

export default Vue.extend({
  name: COMPONENT_NAME,
  props: {
    hton: {
      type: Array,
      required: false,
      default() {
        return null;
      },
    },
    components: {
      type: Object,
      required: false,
      default() {
        return {};
      },
    },
  },
  render(h) {
    const { hton, components } = this.$props;
    Consola.log("Target HTON:", hton);
    const start = performance.now();
    const vroot = hton && htonToVirtualDom(h, hton, components);
    Consola.log("Render done in", performance.now() - start, "ms");
    return vroot || null;
  },
});
</script>
