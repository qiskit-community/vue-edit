import Vue from 'vue'
import VueHead from 'vue-head'
import Vuetify from "vuetify/lib/framework";

import App from './App.vue'

Vue.use(Vuetify);
Vue.use(VueHead);
Vue.config.productionTip = false

new Vue({
  vuetify: new Vuetify({}),
  render: h => h(App),
}).$mount('#app')
