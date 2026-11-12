// Entrée de la page d'accueil. Les autres pages ont leur entrée dans entries/.
import { boot } from './boot.js';
import HomePage from './pages/HomePage.vue';

boot(HomePage, { page: 'home' });
