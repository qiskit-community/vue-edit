<template>
  <component :is="tag">
    <VueEditDomParser v-if="!hton" @hton-ready="hton = $event">
      <slot />
    </VueEditDomParser>
    <VueEditDesign
      v-if="designMode"
      ref="design"
      :hton="hton"
      :components="components"
      :rules="rules"
      @hton-updated="change($event)"
    />
    <VueEditRender v-else :hton="hton" :components="components" />
  </component>
</template>

<script>
import VueEditDomParser from "./VueEditDomParser.vue";
import VueEditRender from "./VueEditRender.vue";
import VueEditDesign from "./VueEditDesign.vue";

const COMPONENT_NAME = "vue-edit";

export default {
  name: COMPONENT_NAME,
  components: {
    VueEditDomParser,
    VueEditRender,
    VueEditDesign,
  },
  model: {
    event: "change",
  },
  props: {
    components: {
      type: Object,
      required: false,
      default() {
        return {};
      },
    },
    tag: {
      type: String,
      required: false,
      default: "div",
    },
    designMode: {
      type: Boolean,
      required: false,
    },
    rules: {
      type: Object,
      required: false,
      default() {
        return {};
      },
    },
    value: {
      type: Array,
      required: false,
      default: null,
    },
  },
  data() {
    return {
      hton: this.value,
    };
  },
  methods: {
    change({ hton, path }) {
      // XXX: shallow-copy to force a data update
      this.hton = Array.from(hton);
      this.$refs.design.setSelected(path);
      this.$emit("change", this.hton);
    },
  },
};
</script>
