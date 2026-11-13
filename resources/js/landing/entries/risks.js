import { boot } from '../boot.js';
import Page from '../pages/LegalPage.vue';

boot(Page, { page: 'risks', props: { doc: 'risks' } });
