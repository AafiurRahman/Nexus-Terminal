import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'light') {
  document.documentElement.classList.remove('dark');
} else {
  // Default to dark if not set or set to dark
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
