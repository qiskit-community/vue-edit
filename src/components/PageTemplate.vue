<template>
  <div class="hello">
    <h1>{{ title }}</h1>
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "PageTemplate",
  props: {
    title: String,
  },
});
</script>

<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
</style>
