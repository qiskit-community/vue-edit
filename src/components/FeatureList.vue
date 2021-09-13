<template>
  <ul>
    <slot />
  </ul>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "FeatureList",
});
</script>

<style scoped lang="scss">
</style>