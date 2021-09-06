<template>
  <a :href="url" target="_blank" rel="noopener"><slot></slot></a>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "TemplateLink",
  props: {
    url: String,
  },
});
</script>

<style scoped lang="scss">
a {
  color: #42b983;
}
</style>
