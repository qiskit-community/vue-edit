<template>
  <div v-if="false" />
</template>

<script>
import Consola from "consola";
import { isTextNode as isHtonTextNode, getText as getHtonText } from "./hton";

const COMPONENT_NAME = "vue-edit-dom-parser";

function virtualDomToHton(vnode) {
  const name = getVDomComponentName(vnode);
  const props = getVDomComponentProps(vnode);
  const children = getVDomComponentChildren(vnode);
  const slots = getVDomComponentSlots(vnode);

  const htonNode = [name, children];
  if (Object.keys(props).length > 0) {
    htonNode.push(props);
  }
  if (Object.keys(slots).length > 0) {
    if (htonNode.length < 3) {
      htonNode.push({});
    }
    htonNode.push(slots);
  }

  return htonNode;
}

function getVDomComponentName(vnode) {
  if (isTextNode(vnode)) {
    return "#t";
  }

  let name = vnode?.tag.split("-").pop();
  if (isComponent(vnode)) {
    if (vnode?.elm?.__vue__?.$options?.name) {
      name = vnode.elm.__vue__.$options.name;
    } else if (vnode?.componentOptions?.Ctor?.options?.name) {
      name = vnode.componentOptions.Ctor.options.name;
    }
  }

  if (!name) {
    throw new Error(`Component name of ${vnode.tag} not found.`);
  }

  return name;
}

function getVDomComponentProps(vnode) {
  if (isTextNode(vnode)) {
    return {};
  }

  const props = {};
  // TODO: What about the class, is it in attributes? Need testing.
  if (vnode?.data?.attrs) {
    Object.assign(props, filterOutAttrs(vnode.data.attrs));
  }
  if (vnode?.componentOptions?.propsData) {
    Object.assign(props, vnode.componentOptions.propsData);
  }
  return props;
}

function getVDomComponentChildren(vnode) {
  if (isTextNode(vnode)) {
    return getText(vnode);
  }

  let children = [];
  if (!isComponent(vnode) && vnode.children) {
    children = vnode.children;
  } else if (vnode?.data?.scopedSlots?._normalized?.default) {
    children = vnode.data.scopedSlots._normalized.default();
  } else if (vnode?.componentOptions?.children) {
    children = vnode.componentOptions.children;
  }
  return children
    .map((vnode) => virtualDomToHton(vnode))
    .filter(nonEmptyHtonTextNodes);
}

function getVDomComponentSlots(vnode) {
  if (!isComponent(vnode)) {
    return {};
  }

  let slots = {};
  if (vnode?.data?.scopedSlots?._normalized) {
    slots = vnode.data.scopedSlots._normalized;
  } else if (vnode?.data?.scopedSlots) {
    slots = vnode.data.scopedSlots;
  }

  const namedSlots = filterOutSlots(slots);
  const result = {};
  for (const [name, slotFn] of Object.entries(namedSlots)) {
    result[name] = slotFn({})
      .map((vnode) => virtualDomToHton(vnode))
      .filter(nonEmptyHtonTextNodes);
  }
  return result;
}

function isComponent(vnode) {
  return (
    (vnode.componentInstance ?? false) || (vnode.componentOptions ?? false)
  );
}

function isTextNode(vnode) {
  return typeof vnode.text !== "undefined";
}

function getText(vnode) {
  return vnode.text;
}

function filterOutAttrs(attrs) {
  const filtered = {};
  const filterOutList = [];
  for (const [name, value] of Object.entries(attrs)) {
    if (!filterOutList.includes(name)) {
      filtered[name] = value;
    }
  }
  return filtered;
}

function filterOutSlots(slots) {
  const filtered = {};
  for (const [name, value] of Object.entries(slots)) {
    if (name !== "default" && !name.startsWith("__") && !name.startsWith("$")) {
      filtered[name] = value;
    }
  }
  return filtered;
}

function nonEmptyHtonTextNodes(hton) {
  return !isHtonTextNode(hton) || getHtonText(hton).trim() !== "";
}

export default {
  name: COMPONENT_NAME,
  mounted() {
    const root = this.$slots.default.find((vnode) => !!vnode.tag);
    if (!root) {
      Consola.error(
        `\`${COMPONENT_NAME}\` component's default slot cannot be empty.`
      );
      return;
    }
    const hton = virtualDomToHton(root);
    this.$emit("hton-ready", hton);
  },
};
</script>
