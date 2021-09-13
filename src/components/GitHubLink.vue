<template>
  <TLink :url="urls[sec]" :in-edit-mode="inEditMode"><slot>GitHub</slot></TLink>
</template>

<script lang="ts">
import Vue from "vue";
import TLink from "./TLink.vue";

export default Vue.extend({
  name: "GitHubLink",
  components: {
    TLink,
  },
  props: {
    inEditMode: {
      type: Boolean,
      default: false,
    },
    sec: {
      type: String,
      default: "index",
    },
  },
  data() {
    return {
      urls: {
        index: "https://github.com/qiskit-community/vue-edit",
        readme: "https://github.com/qiskit-community/vue-edit#vue-edit",
        hton: "https://github.com/qiskit-community/vue-edit#hton",
      },
    };
  },
});
</script>
