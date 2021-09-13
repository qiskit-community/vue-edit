<template>
  <component
    :is="inEditMode ? 'span' : 'a'"
    class="link"
    :href="url"
    target="_blank"
    rel="noopener"
    ><slot></slot
  ></component>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "TemplateLink",
  props: {
    url: String,
    inEditMode: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style scoped lang="scss">
.link {
  color: #42b983;
}
</style>
