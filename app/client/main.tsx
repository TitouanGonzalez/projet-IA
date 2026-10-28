import { createRoot } from 'react-dom/client';
import './styles.css';
import './alien/alien.css';
import App, { Preview } from './App.js';
import AlienSite from './alien/AlienSite.js';

// La page publique est le site Nostromo. L'atelier d'origine (DS-Studio) reste disponible
// à l'adresse /#atelier, avec ses tokens, son historique et ses tests.
const params = new URLSearchParams(location.search);
const preview = params.get('preview') === '1';
const atelier = location.hash === '#atelier';
if (preview) document.body.classList.add('preview-body');
createRoot(document.getElementById('root')!).render(
  preview ? <Preview /> : atelier ? <App /> : <AlienSite />,
);
