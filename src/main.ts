import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'material-icons/iconfont/filled.css'
import './style.css'
import App from './App.vue'
import { registerServiceWorker } from './pwa'

createApp(App).mount('#app')
registerServiceWorker()
