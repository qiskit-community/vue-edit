<template>
  <section>
    <img alt="Vue logo" src="../assets/logo.png" />
    <form>
      <p>
        <label
          ><input type="checkbox" v-model="inEditMode" /> Toggle edit mode
        </label>
        <button @click.prevent="localContent = null">Restore content</button>
      </p>
    </form>
    <VueEdit
      v-model="localContent"
      :components="templateComponents"
      :rules="{
        insertParagraph: ['p', 'li'],
      }"
      :design-mode="inEditMode"
    >
      <PageTemplate title="Meet the vue-edit component!">
        <p>
          <code>vue-edit</code> is a
          <TLink url="https://vuejs.org/">Vue.js</TLink> component-tree editor
          built on top of the <GitHubLink sec="hton">hton</GitHubLink> format.
        </p>
        <p>
          <code>vue-edit</code> is also a library of components, you can use it
          "as is", or you can fully customize the editor while reusing
          everything else.
        </p>
        <h3>How can I use it?</h3>
        <p>
          <code>vue-edit</code> is still in beta! Read the
          <GitHubLink sec="readme"><code>README.md</code></GitHubLink> for more
          info.
        </p>
        <h3>What <code>vue-edit</code> is not?</h3>
        <p><code>vue-edit</code><em> is not</em> a rich text editor.</p>
        <h3>What you can do with <code>vue-edit</code>?</h3>
        <p>
          For <code>vue-edit</code>, a component, a tag or a node are all the
          same.
        </p>
        <p>With <code>vue-edit</code> you can&hellip;</p>
        <FeatureList>
          <li>Navigate the component tree.</li>
          <li>Edit the text inside a component.</li>
          <li>Wrap some text with a component.</li>
          <li>Wrap a component with another component.</li>
          <li>Add a new child node to a component.</li>
          <li>Remove a child node from a component.</li>
          <li>Edit properties of a component.</li>
          <li>Reorder the children of a component.</li>
          <li>Remove a component without removing its children.</li>
          <li>Split and combine text components.</li>
          <li>Customize the semantics of the components.</li>
          <li>Customize the edition experience.</li>
        </FeatureList>
        <h3>We are open-source!</h3>
        <ul>
          <li>
            <GitHubLink>Find us at GitHub</GitHubLink>
          </li>
        </ul>
      </PageTemplate>
    </VueEdit>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import VueEdit from "../lib/VueEdit.vue";
import PageTemplate from "../components/PageTemplate.vue";
import TLink from "../components/TLink.vue";
import GitHubLink from "../components/GitHubLink.vue";
import FeatureList from "../components/FeatureList.vue";

export default Vue.extend({
  name: "VueEditIndex",
  components: {
    VueEdit,
    PageTemplate,
    TLink,
    GitHubLink,
    FeatureList,
  },
  computed: {
    templateComponents() {
      return {
        PageTemplate,
        TLink,
        GitHubLink,
        FeatureList,
      };
    },
  },
  methods: {
    removeLocalVersion() {
      localStorage.removeItem("vue-edit-content");
    },
  },
  data() {
    return {
      inEditMode: true,
      localContent: null,
    };
  },
  watch: {
    localContent(newValue) {
      if (!newValue) {
        this.removeLocalVersion();
      } else {
        localStorage.setItem("vue-edit-content", JSON.stringify(newValue));
      }
    },
  },
  mounted() {
    const localContent = localStorage.getItem("vue-edit-content");
    if (localContent) {
      this.localContent = JSON.parse(localContent);
    }
  },
});
</script>

<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
button {
  background-color: #42b983;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
}
p {
  margin: 20px 0;
}
</style>
