<template>
  <header>
    <h1><slot /></h1>
    <p><slot name="subtitle" /></p>
  </header>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "AppHeader",
});
</script>
