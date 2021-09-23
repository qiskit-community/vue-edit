# vue-edit

> A Vue.js component-tree editor built on top of a
> [easily serializable format](#hton).

## Demo

Feel free to [edit our landing page](). ;)

## Install as a library

Easiest way to use it is to install it as a dependency of your project:

```
npm install qiskit-community/vue-edit#0.1.0
```

## Usage

When using `vue-edit`, import it in your Vue.js application:

```html
<template>
  <VueEdit v-model="content" design-mode>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ultrices quis mauris eget tempor. Aenean dapibus elit dolor, ac iaculis augue hendrerit elementum. Aliquam rhoncus mollis metus vel feugiat. Integer at viverra lacus. Suspendisse potenti. Vivamus rutrum, ligula a convallis elementum, turpis nisi congue odio, non ullamcorper tellus diam eget dolor. Nunc nisi nisl, volutpat non massa vitae, convallis interdum lectus. Vestibulum semper, purus lobortis pharetra fermentum, nunc mauris facilisis ipsum, nec rutrum ligula velit ut dolor. Quisque tincidunt tortor sit amet tellus hendrerit, eget tempor lorem auctor. Aliquam ut purus enim. Integer dignissim, quam vitae mollis laoreet, purus nunc facilisis nibh, nec blandit nisl ante a neque. Integer eleifend neque sed magna blandit faucibus. Morbi in placerat diam.
    </p>
  </VueEdit>
</template>

<script>
import VueEdit from 'vue-edit';

export default {
  components: {
    VueEdit
  },
  data () {
    return {
      content: null
    };
  }
}
</script>
```

Whatever it is in the main slot gets parsed as [`hton`](#hton) and makes
`vue-edit` emit a `change` event with this representation. You can feed it back
to `vue-edit` with the `v-model` directive.

### Properties

| Property    | Type    | Default | Description                                        |
|-------------|---------|---------|----------------------------------------------------|
| components  | Object  | {}      | A map of component names to component definitions. |
| tag         | String  | 'div'   | The tag to use for the root element.               |
| design-mode | Boolean | false   | Whether the design mode is enabled or not.         |
| rules       | Object  | {}      | Options for the design mode.                       |
| value       | Array   | null    | The HTON array to edit.                            |

### Use with components

`vue-edit` is intended to be used with a library of highly-declarative
components part of a template library where behaviour and style are encapsulated
inside the component, like in the follwing snippet:

```html
<template>
  <VueEdit
    v-model="content"
    :components="templateComponents"
    design-mode
  >
    <ProjectCard>
      <ProjectTitle>Qiskit.org</ProjectTitle>
      <ProjectDescription>
        Qiskit is a quantum computing platform that enables developers to build
        quantum applications that perform tasks beyond the capabilities of
        traditional quantum computing.
        <ProjectLink url="https://qiskit.org">Qiskit.org</ProjectLink>
        is the landing page for Qiskit.
      </ProjectDescription>
    </ProjectCard>
  </VueEdit>
</template>

<script>
import VueEdit from 'vue-edit';
import { ProjectCard, ProjectTitle, ProjectDescription, ProjectLink } from 'project-components';

const templateComponents = {
  ProjectCard,
  ProjectTitle,
  ProjectDescription,
  ProjectLink
}

export default {
  components: {
    VueEdit,
    ...templateComponents
  },
  data () {
    return {
      content: null,
      templateComponents
    };
  }
}
</script>
```

*Note*: Integration with scoped CSS does not work since the render component is
not able to set its own scope in its descendants.

### Persisting the content

`vue-edit` does not persist the content in the browser nor in any external
database. It just emit a `change` event every time you change the component
tree. You may  use the regular suspects such as `vuex` or `localStorage` to
persist the content.

The [demo application]() that comes with `vue-edit` uses [`localStorage`]().

### Using your own editor

`vue-edit` is intended to be modular. You can

## HTON

HTON is a [serializable format](https://en.wikipedia.org/wiki/Serialization)
for Vue.js and other component based frameworks. It represents an HTML DOM-like
tree and the name stands for "HyperText Object Notation".

HTON nodes are of two types: `tag` and `text`. Text nodes tag

## What is missing?

The minimum functionality is there but the library is not complete. First step
in the roadmap is improve the included editor so it is independent from
Vuetify.js, and more usable, in general.

The *codebase* could be beter, we need more tests to make sure HTON manipulation
is correct, and the behavior is predictable.

The *editor* is intended to be a competent tree editor, aimed at modifying HTON
in a wysiwyg fashion. It is not intended to be a full blown text editor but
editing text inside content nodes should feel natural enough. It should not
rely on Vuetify.js for avoiding interference with the user's preferred UI
framework.

The *HTON representation* is not finished and we think it may become a robust
enough format to be isolated and maintained separately so it can be reused in
other projects, even for other component frameworks.

Finally, We are working on a *version for Vue3.js* based on this same version
but would be great if the editor could be compatible with both versions at the
same time.
## Wanna contribute?

Start by reading our [code of conduct](), now clone the repository and get
familiar with the project.
### Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run the unit tests
```
npm run test:unit
```

### Run the end-to-end tests
```
npm run test:e2e
```

### Lints and fixes files
```
npm run lint
```

## License

[Apache Licens 2.0]()