import './lib/analyticsConsentBootstrap';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';
import { attachGa4SpaPageViews } from './lib/ga4';
import { router } from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
attachGa4SpaPageViews(router);
app.mount('#app');
