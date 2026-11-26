import { createRoot } from 'react-dom/client';
import DeskScene from './DeskScene.jsx';

function mount() {
  const el = document.getElementById('hero-desk');
  if (!el) return;
  createRoot(el).render(<DeskScene />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
