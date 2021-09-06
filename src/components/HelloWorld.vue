<template>
  <VueEdit
    :components="{
      ...$options.components,
    }"
  >
    <HelloWorldTemplate :msg="msg" />
  </VueEdit>
</template>

<script lang="ts">
import Vue from "vue";
import VueEdit from "./VueEdit.vue";
import HelloWorldTemplate from "./HelloWorldTemplate.vue";

export default Vue.extend({
  name: "HelloWorld",
  components: {
    VueEdit,
    HelloWorldTemplate,
  },
  props: {
    msg: String,
  },
});
</script>

<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
</style>
