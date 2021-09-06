<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      For a guide and recipes on how to configure / customize this project,<br />
      check out the
      <TemplateLink url="https://cli.vuejs.org"
        >vue-cli documentation</TemplateLink
      >.
    </p>
    <h3>Installed CLI Plugins</h3>
    <ul>
      <li>
        <TemplateLink
          url="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel"
          target="_blank"
          rel="noopener"
          >babel</TemplateLink
        >
      </li>
      <li>
        <TemplateLink
          url="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-typescript"
          target="_blank"
          rel="noopener"
          >typescript</TemplateLink
        >
      </li>
      <li>
        <TemplateLink
          url="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint"
          target="_blank"
          rel="noopener"
          >eslint</TemplateLink
        >
      </li>
      <li>
        <TemplateLink
          url="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-unit-jest"
          target="_blank"
          rel="noopener"
          >unit-jest</TemplateLink
        >
      </li>
      <li>
        <TemplateLink
          url="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-e2e-nightwatch"
          target="_blank"
          rel="noopener"
          >e2e-nightwatch</TemplateLink
        >
      </li>
    </ul>
    <h3>Essential Links</h3>
    <ul>
      <li>
        <TemplateLink url="https://vuejs.org">Core Docs</TemplateLink>
      </li>
      <li>
        <TemplateLink url="https://forum.vuejs.org">Forum</TemplateLink>
      </li>
      <li>
        <TemplateLink url="https://chat.vuejs.org">Community Chat</TemplateLink>
      </li>
      <li>
        <TemplateLink url="https://twitter.com/vuejs">Twitter</TemplateLink>
      </li>
      <li>
        <TemplateLink url="https://news.vuejs.org">News</TemplateLink>
      </li>
    </ul>
    <h3>Ecosystem</h3>
    <ul>
      <li>
        <TemplateLink url="https://router.vuejs.org">vue-router</TemplateLink>
      </li>
      <li>
        <TemplateLink url="https://vuex.vuejs.org">vuex</TemplateLink>
      </li>
      <li>
        <TemplateLink url="https://github.com/vuejs/vue-devtools#vue-devtools"
          >vue-devtools</TemplateLink
        >
      </li>
      <li>
        <TemplateLink url="https://vue-loader.vuejs.org"
          >vue-loader</TemplateLink
        >
      </li>
      <li>
        <TemplateLink url="https://github.com/vuejs/awesome-vue"
          >awesome-vue</TemplateLink
        >
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import TemplateLink from "./TemplateLink.vue";

export default Vue.extend({
  name: "HelloWorldTemplate",
  components: {
    TemplateLink,
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
