import '@fontsource-variable/archivo/wdth.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { splashReady } from './lib/splash';

const appName = import.meta.env.VITE_APP_NAME || 'GoLuckyTen';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    // Pages load on demand, so the first visit only downloads what it shows.
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx');
        const page = pages[`./Pages/${name}.jsx`];
        if (!page) throw new Error(`Page not found: ${name}`);
        return page();
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
        requestAnimationFrame(() => splashReady());
    },
    progress: { color: '#7B5CFA' },
});

// PWA: offline page, cached assets and push. Production only, so dev reloads stay instant.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
