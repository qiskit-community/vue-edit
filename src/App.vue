<template>
  <main id="app">
    <VueEditIndex />
  </main>
</template>

<script lang="ts">
import Vue from "vue";
import VueEditIndex from "./pages/VueEditIndex.vue";

export default Vue.extend({
  name: "App",
  head: {
    link: [
      {
        href: "https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900",
        rel: "stylesheet",
      },
      {
        href: "https://cdn.jsdelivr.net/npm/@mdi/font@4.x/css/materialdesignicons.min.css",
        rel: "stylesheet",
      },
    ],
  },
  components: {
    VueEditIndex,
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
