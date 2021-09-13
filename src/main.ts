import Vue from 'vue'
import VueHead from 'vue-head'
import vuetify from '@/plugins/vuetify' // path to vuetify export

import App from './App.vue'

Vue.use(VueHead);
Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App),
}).$mount('#app')
