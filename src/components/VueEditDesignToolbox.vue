<template>
  <v-sheet
    class="vue-edit-toolbox"
    elevation="2"
    outlined
    dark
  >
    <v-breadcrumbs divider=">" :items="selectionPathNodes">
      <template #item="{ item }">
        <v-breadcrumbs-item>
          <v-btn
            elevation="2"
            @click="requestSelectionChange(item.path)"
          >
            <span style="text-transform: none">{{ item.name }}</span>
          </v-btn>
          <v-btn
            icon
            small
            @click="requestUnwrap(item.path)"
          >
            <v-icon>
              mdi-border-none-variant
            </v-icon>
          </v-btn>
          <v-btn
            icon
            small
            @click="requestNodeRemoval(item.path)"
          >
            <v-icon>
              mdi-delete
            </v-icon>
          </v-btn>
        </v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>
    <v-divider />
    <v-container fluid>
      <v-row no-gutters>
        <v-col class="scroll">
          <v-card>
            <v-card-text>
              <p v-if="noSelectionProperties">
                No properties for this component.
              </p>
              <v-text-field
                v-for="prop in selectionProperties"
                v-else
                :key="prop.name"
                :label="prop.name"
                :hint="`Type: ${getTextFieldType(prop)}`"
                :value="isObject(prop) ? jsonValue(prop.value) : prop.value"
                :rules="isObject(prop) ? [isJson] : []"
                @change="requestPropertyChange(prop, $event)"
              />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col class="scroll">
          <v-card>
            <v-card-text>
              <p
                v-if="!allSelectionSlots.length || selectionType === 'text'"
              >
                No children for this element.
              </p>
              <v-list v-else>
                <v-list-group
                  v-for="slot in allSelectionSlots"
                  :key="slot.name"
                >
                  <template #activator>
                    <v-list-item-title>
                      {{ slot.name }}
                    </v-list-item-title>
                  </template>
                  <v-list-item-group
                    color="primary"
                  >
                    <v-list-item v-if="slot.children.length > 0">
                      <v-text-field
                        :ref="`new-node-${slot.name}-start`"
                        label="New child at the start"
                      />
                      <v-btn
                        icon
                        @click="requestNewNode(slot, 'start')"
                      >
                        <v-icon>
                          mdi-plus
                        </v-icon>
                      </v-btn>
                    </v-list-item>
                    <v-draggable
                      handle=".drag-handle"
                      @end="requestNodePositionChange(slot, $event.oldIndex, $event.newIndex)"
                    >
                      <v-list-item
                        v-for="child in slot.children"
                        :key="child.path"
                      >
                        <v-icon class="drag-handle">
                          mdi-dots-vertical
                        </v-icon>
                        <v-list-item-content>
                          [{{ child.index }}] {{ child.name }}
                        </v-list-item-content>
                        <v-btn
                          icon
                          @click="requestSelectionChange(child.path)"
                        >
                          <v-icon>
                            mdi-target
                          </v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          @click="requestNodeRemoval(child.path)"
                        >
                          <v-icon>
                            mdi-delete
                          </v-icon>
                        </v-btn>
                      </v-list-item>
                    </v-draggable>
                    <v-list-item>
                      <v-text-field
                        :ref="`new-node-${slot.name}-end`"
                        label="New child at the end"
                      />
                      <v-btn
                        icon
                        @click="requestNewNode(slot, 'end')"
                      >
                        <v-icon>
                          mdi-plus
                        </v-icon>
                      </v-btn>
                    </v-list-item>
                  </v-list-item-group>
                  <v-divider />
                </v-list-group>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col>
          <v-card>
            <v-card-text>
              <v-text-field
                v-model="wrappingComponentName"
                label="Wrap with component"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                text
                color="primary"
                type="submit"
                @click="requestWrapSelection(wrappingComponentName.trim())"
              >
                Wrap
              </v-btn>
            </v-card-actions>
          </v-card>
          <v-card>
            <v-card-title>Quick wraps</v-card-title>
            <v-card-text>
              <v-btn
                @click="requestWrapSelection('strong')"
              >
                <v-icon>
                  mdi-format-bold
                </v-icon>
              </v-btn>
              <v-btn
                @click="requestWrapSelection('em')"
              >
                <v-icon>
                  mdi-format-italic
                </v-icon>
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue'
import Consola from 'consola'
import { HtonPath, TextNodeOffset } from './hton'
import { getSelectionStartAndEndOffsets } from './domtools'

const COMPONENT_NAME = 'vue-edit-design-toolbox'

export interface PropertyView {
  name: string
  value: any
}

export interface ChildView {
  name: string
  index?: number | undefined
  path: HtonPath
}

export interface SlotView {
  path: HtonPath
  name: string
  children: ChildView[]
}

export interface NodePositionChangeEvent {
  path: HtonPath
  index: number
}

export interface NewNodeEvent {
  path: HtonPath
  index: number | 'start' | 'end'
  slotName?: string | undefined
  nodeName: string
}

export interface WrapNodeEvent {
  nodeName: string
  start: HtonPath | TextNodeOffset
  end?: HtonPath | TextNodeOffset | undefined
}

export interface UnwrapEvent {
  path: HtonPath
}

export default Vue.extend({
  name: COMPONENT_NAME,
  props: {
    selectionPath: {
      type: String,
      required: false,
      default: null
    } as PropOptions<HtonPath | null>,
    selectionType: {
      type: String,
      required: false,
      default: null
    } as PropOptions<'text' | 'tag' | null>,
    selectionPathNodes: {
      type: Array,
      required: false,
      default () { return [] }
    } as PropOptions<ChildView[]>,
    selectionProperties: {
      type: Array,
      required: false,
      default () { return [] }
    } as PropOptions<PropertyView[]>,
    selectionSlots: {
      type: Object,
      required: false,
      default () { return {} }
    } as PropOptions<Record<string, ChildView[]>>,
    selectionChildren: {
      type: Array,
      required: false,
      default () { return [] }
    } as PropOptions<ChildView[]>
  },
  data () {
    return { wrappingComponentName: '' }
  },
  computed: {
    noSelectionProperties (): boolean {
      return this.selectionProperties.length === 0
    },
    allSelectionSlots (): SlotView[] {
      const path = this.selectionPath
      if (path === null) { return [] }
      const defaultChildren = { default: this.selectionChildren }
      const otherSlots = this.selectionSlots
      const allSlots = {
        ...defaultChildren,
        ...otherSlots
      }
      return Object
        .entries(allSlots)
        .map(([name, children]) => ({
          path,
          name,
          children
        }))
    },
    noSelectionSlots (): boolean {
      return this.allSelectionSlots.every(({ children }) => !children.length)
    }
  },
  methods: {
    isObject (property: PropertyView): boolean {
      return typeof property.value === 'object'
    },
    isJson (value: string): boolean | string {
      try {
        JSON.parse(value)
        return true
      } catch (err) {
        return 'Not a valid JSON string'
      }
    },
    jsonValue (value: Object): string {
      return JSON.stringify(value)
    },
    requestPropertyChange (property: PropertyView, value: any) {
      try {
        value = this.isObject(property) ? JSON.parse(value) : value
      } catch (err) {
        return
      }
      this.$emit('property-change', {
        path: this.selectionPath,
        name: property.name,
        value
      })
    },
    getTextFieldType (property: PropertyView): string {
      const type = typeof property.value
      return type === 'object' ? 'JSON' : type
    },
    requestSelectionChange (path: HtonPath | null) {
      this.$emit('selection-change', path)
    },
    requestNodeRemoval (path: HtonPath) {
      this.$emit('node-removal', path)
    },
    requestNodePositionChange (slot: SlotView, oldIndex: number, newIndex: number) {
      const path = this.isDefaultSlot(slot)
        ? this.selectionChildren?.[oldIndex].path
        : this.selectionSlots?.[slot.name]?.[oldIndex].path
      if (!path) {
        Consola.error(`It was not possible to locate the node at position ${oldIndex} in the slot`, slot)
        return
      }
      this.$emit('node-position-change', { path, index: newIndex })
    },
    requestNewNode (slot: SlotView, position: 'start' | 'end') {
      const path = slot.path
      const newNodeNameInput =
        (this.$refs[`new-node-${slot.name}-${position}`] as Vue[])[0]
      // TODO: Do this in a more Vue way, binding it with a
      // model to avoid accessing an internal property, or propose a new UI.
      const nodeName =
        (newNodeNameInput as Vue & { internalValue: any })
          .internalValue
          .trim()
      if (!nodeName) { return }
      const slotName = this.isDefaultSlot(slot)
        ? undefined
        : slot.name
      this.$emit('new-node', { path, slotName, nodeName, index: position })
    },
    requestWrapSelection (nodeName: string) {
      const currentPath = this.selectionPath
      if (!nodeName || !currentPath) { return }

      let event: WrapNodeEvent | null = null
      const selectionBoundaries = getSelectionStartAndEndOffsets()
      if (!selectionBoundaries || selectionBoundaries[0] === selectionBoundaries[1]) {
        event = {
          nodeName,
          start: currentPath
        }
      } else {
        const [startOffset, endOffset] = selectionBoundaries
        event = {
          nodeName,
          start: {
            path: currentPath,
            offset: startOffset
          },
          end: {
            path: currentPath,
            offset: endOffset
          }
        }
      }
      this.$emit('wrap', event)
    },
    requestUnwrap (path: HtonPath) {
      this.$emit('unwrap', { path })
    },
    isDefaultSlot (slot: SlotView): boolean {
      return slot.name === 'default'
    }
  }
})
</script>

<style lang="scss" scoped>
.vue-edit-toolbox {
  position: fixed;
  left: 0;
  bottom: 0;
  height: var(--vue-edit-toolbox-height);
  width: 100vw;
  z-index: 100;
}

.scroll {
  height: calc(var(--vue-edit-toolbox-height) - 50px - 2 * 12px);
  overflow-y: auto;
}
</style>
