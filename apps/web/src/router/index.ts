import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/emf', name: 'emf', component: () => import('../views/EmfView.vue') },
    { path: '/spirit', name: 'spirit', component: () => import('../views/SpiritView.vue') },
    { path: '/evp', name: 'evp', component: () => import('../views/EvpView.vue') },
    { path: '/privacy', name: 'privacy', component: () => import('../views/PrivacyPolicyView.vue') },
    { path: '/terms', name: 'terms', component: () => import('../views/TermsOfServiceView.vue') },
  ],
});
