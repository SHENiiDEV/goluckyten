// Brand intro controller. The markup and critical CSS live in resources/views/partials/splash*.blade.php.
const KEY = 'lt_last_active';
const IDLE_MS = 10 * 60 * 1000;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const minShow = () => (reduced() ? 600 : 2300);

const read = () => {
    try {
        return Number(localStorage.getItem(KEY)) || 0;
    } catch {
        return 0;
    }
};
const write = (t) => {
    try {
        localStorage.setItem(KEY, String(t));
    } catch {}
};

let shownAt = 0;
let leaving = false;

function el() {
    return document.getElementById('lt-splash');
}

function hide(delay = 0) {
    const node = el();
    if (!node || leaving) return;
    setTimeout(() => {
        leaving = true;
        node.classList.add('is-leaving');
        const done = () => {
            node.classList.remove('is-leaving', 'is-replay');
            document.documentElement.classList.remove('lt-splash');
            leaving = false;
        };
        node.addEventListener('animationend', function end(e) {
            if (e.target !== node) return;
            node.removeEventListener('animationend', end);
            done();
        });
        setTimeout(() => leaving && done(), 900); // safety net
    }, delay);
}

/** Show the intro again (after a long idle). Animations restart because the node goes from display:none to grid. */
function replay() {
    const node = el();
    if (!node || document.documentElement.classList.contains('lt-splash')) return;
    node.classList.add('is-replay');
    document.documentElement.classList.add('lt-splash');
    shownAt = performance.now();
    hide(minShow());
}

/** Call once the app has rendered. */
export function splashReady() {
    if (document.documentElement.classList.contains('lt-splash')) {
        const elapsed = performance.now(); // since navigation start, when the splash first painted
        hide(Math.max(0, minShow() - elapsed));
    }

    let lastWrite = 0;
    const touch = () => {
        const now = Date.now();
        if (now - read() > IDLE_MS) replay();
        if (now - lastWrite > 15000) {
            write(now);
            lastWrite = now;
        }
    };
    ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((t) => window.addEventListener(t, touch, { passive: true }));
    let moveTimer = 0;
    window.addEventListener('pointermove', () => {
        if (moveTimer) return;
        moveTimer = setTimeout(() => (moveTimer = 0), 5000);
        touch();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') touch();
        else write(Date.now());
    });
}
