{{--
    Brand intro. Shown on the first visit and again after 10+ minutes of inactivity.
    Critical CSS is inline so it paints before the app bundle loads; resources/js/lib/splash.js
    hides it once the app is ready and replays it after a long idle.
--}}
<style>
    #lt-splash { display: none; }
    html.lt-splash { overflow: hidden; }
    html.lt-splash #lt-splash, #lt-splash.is-replay {
        display: grid; place-items: center; position: fixed; inset: 0; z-index: 2147483000;
        background: #0d0a12; color: #f5f2fa; overflow: hidden;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    #lt-splash .lt-orb { position: absolute; border-radius: 9999px; filter: blur(70px); opacity: 0; will-change: transform, opacity; }
    #lt-splash .lt-orb-a { width: 46vmax; height: 46vmax; left: -12vmax; top: -16vmax; background: #6a4cf6; animation: lt-orb-in 1.2s cubic-bezier(.23,1,.32,1) .05s forwards, lt-drift-a 7s ease-in-out 1.2s infinite alternate; }
    #lt-splash .lt-orb-b { width: 40vmax; height: 40vmax; right: -14vmax; bottom: -18vmax; background: #ff3d9a; animation: lt-orb-in 1.2s cubic-bezier(.23,1,.32,1) .2s forwards, lt-drift-b 8s ease-in-out 1.2s infinite alternate; }
    #lt-splash .lt-grain { position: absolute; inset: 0; opacity: .06; background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 3px 3px; mix-blend-mode: overlay; }

    #lt-splash .lt-stage { position: relative; width: min(86vw, 680px); display: grid; justify-items: center; gap: clamp(22px, 5vw, 34px); }
    #lt-splash .lt-lockup { position: relative; width: 100%; aspect-ratio: 5.7623; }
    #lt-splash .lt-mark, #lt-splash .lt-word { position: absolute; display: block; }
    #lt-splash .lt-mark { left: 0; top: 0; width: 21.73%; height: 92.75%; }
    #lt-splash .lt-word { left: 21.43%; top: 25.51%; width: 78.57%; height: 74.49%; }
    #lt-splash img { display: block; width: 100%; height: 100%; user-select: none; -webkit-user-drag: none; }

    /* Ticket arrives at speed, like the app icon: motion lines first, then the ticket with a little overshoot. */
    #lt-splash .lt-lines { position: absolute; right: 92%; top: 30%; width: 90%; height: 52%; display: grid; align-content: space-between; justify-items: end; }
    #lt-splash .lt-lines i { display: block; height: 0; padding-top: 7.5%; border-radius: 99px; background: linear-gradient(90deg, rgba(123,92,250,0), #7b5cfa 35%, #ff3d9a); transform-origin: right center; opacity: 0; }
    #lt-splash .lt-lines i:nth-child(1) { width: 70%; animation: lt-line .9s cubic-bezier(.23,1,.32,1) .1s forwards; }
    #lt-splash .lt-lines i:nth-child(2) { width: 100%; animation: lt-line .9s cubic-bezier(.23,1,.32,1) .03s forwards; }
    #lt-splash .lt-lines i:nth-child(3) { width: 48%; animation: lt-line .9s cubic-bezier(.23,1,.32,1) .16s forwards; }
    #lt-splash .lt-ticket { position: absolute; inset: 0; opacity: 0; animation: lt-ticket .75s cubic-bezier(.2,1.25,.35,1) .22s forwards; }
    #lt-splash .lt-shine { position: absolute; inset: 0; -webkit-mask: url(/images/brand/mark-ticket.webp) center / 100% 100% no-repeat; mask: url(/images/brand/mark-ticket.webp) center / 100% 100% no-repeat; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.55) 50%, transparent 65%) no-repeat; background-size: 250% 100%; background-position: 130% 0; animation: lt-shine 1s ease-in-out 1.15s forwards; }

    /* Sparkle: pops and spins in, then twinkles. Tiny satellites burst out once. */
    #lt-splash .lt-spark { position: absolute; left: 75.9%; top: 0; width: 24.1%; aspect-ratio: 1; opacity: 0; animation: lt-spark .6s cubic-bezier(.2,1.4,.4,1) .72s forwards, lt-twinkle 2.4s ease-in-out 1.4s infinite; }
    #lt-splash .lt-spark svg { width: 100%; height: 100%; filter: drop-shadow(0 0 12px rgba(255,61,154,.75)); }
    #lt-splash .lt-bit { position: absolute; left: 84.5%; top: 12%; width: 7%; aspect-ratio: 1; opacity: 0; }
    #lt-splash .lt-bit svg { width: 100%; height: 100%; }
    #lt-splash .lt-bit-1 { animation: lt-bit-1 .9s cubic-bezier(.23,1,.32,1) .8s forwards; }
    #lt-splash .lt-bit-2 { animation: lt-bit-2 .9s cubic-bezier(.23,1,.32,1) .84s forwards; }
    #lt-splash .lt-bit-3 { animation: lt-bit-3 .9s cubic-bezier(.23,1,.32,1) .88s forwards; }

    /* Wordmark wipes in left to right, behind the ticket. */
    #lt-splash .lt-word { clip-path: inset(-10% 100% -10% 0); animation: lt-wipe .7s cubic-bezier(.77,0,.175,1) .62s forwards; }
    #lt-splash .lt-word img { transform: translateX(-4%); animation: lt-settle .9s cubic-bezier(.23,1,.32,1) .62s forwards; }

    #lt-splash .lt-tag { margin: 0; font-size: clamp(11px, 2.8vw, 13px); font-weight: 600; letter-spacing: .32em; text-transform: uppercase; color: #a39bb4; opacity: 0; animation: lt-up .6s cubic-bezier(.23,1,.32,1) 1.2s forwards; }
    #lt-splash .lt-tag b { color: #fff; font-weight: 700; }
    #lt-splash .lt-bar { width: min(46vw, 180px); height: 3px; border-radius: 9px; background: rgba(255,255,255,.08); overflow: hidden; opacity: 0; animation: lt-up .4s ease 1.1s forwards; }
    #lt-splash .lt-bar i { display: block; height: 100%; width: 100%; border-radius: inherit; background: linear-gradient(90deg, #7b5cfa, #ff3d9a); transform-origin: left; transform: scaleX(0); animation: lt-load 1.6s cubic-bezier(.65,0,.35,1) 1.1s forwards; }

    /* Exit: content lifts and the curtain fades, so the page underneath is revealed. */
    #lt-splash.is-leaving { animation: lt-out .5s cubic-bezier(.23,1,.32,1) forwards; pointer-events: none; }
    #lt-splash.is-leaving .lt-stage { animation: lt-lift .5s cubic-bezier(.23,1,.32,1) forwards; }

    @keyframes lt-orb-in { to { opacity: .55; } }
    @keyframes lt-drift-a { to { transform: translate(6vmax, 4vmax) scale(1.08); } }
    @keyframes lt-drift-b { to { transform: translate(-5vmax, -3vmax) scale(1.1); } }
    @keyframes lt-line { 0% { opacity: 0; transform: translateX(-80%) scaleX(.3); } 35% { opacity: 1; transform: translateX(0) scaleX(1); } 100% { opacity: 0; transform: translateX(30%) scaleX(.15); } }
    @keyframes lt-ticket { 0% { opacity: 0; transform: translateX(-38%) skewX(-12deg) scale(.92); filter: blur(6px); } 60% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: none; filter: none; } }
    @keyframes lt-shine { to { background-position: -30% 0; } }
    @keyframes lt-spark { 0% { opacity: 0; transform: scale(.2) rotate(-120deg); } 100% { opacity: 1; transform: none; } }
    @keyframes lt-twinkle { 0%, 100% { transform: scale(1) rotate(0); } 50% { transform: scale(.82) rotate(18deg); } }
    @keyframes lt-bit-1 { 0% { opacity: 0; transform: none; } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(260%, -180%) scale(.5) rotate(90deg); } }
    @keyframes lt-bit-2 { 0% { opacity: 0; transform: none; } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(320%, 60%) scale(.4) rotate(-80deg); } }
    @keyframes lt-bit-3 { 0% { opacity: 0; transform: none; } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(40%, -300%) scale(.5) rotate(120deg); } }
    @keyframes lt-wipe { to { clip-path: inset(-10% -2% -10% 0); } }
    @keyframes lt-settle { to { transform: none; } }
    @keyframes lt-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes lt-load { 0% { transform: scaleX(0); } 70% { transform: scaleX(.86); } 100% { transform: scaleX(1); } }
    @keyframes lt-out { to { opacity: 0; visibility: hidden; } }
    @keyframes lt-lift { to { transform: translateY(-10px) scale(1.03); opacity: 0; filter: blur(4px); } }

    @media (prefers-reduced-motion: reduce) {
        #lt-splash *, #lt-splash *::before { animation-duration: 1ms !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; }
        #lt-splash .lt-stage { animation: lt-up .4s ease both !important; }
        #lt-splash .lt-lines { display: none; }
        #lt-splash .lt-bit { display: none; }
    }
</style>
<script>
    (function () {
        try {
            var last = +localStorage.getItem('lt_last_active') || 0;
            if (!last || Date.now() - last > 10 * 60 * 1000) document.documentElement.classList.add('lt-splash');
            localStorage.setItem('lt_last_active', String(Date.now()));
        } catch (e) {}
    })();
</script>
