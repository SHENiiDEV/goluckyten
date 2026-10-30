import { useEffect, useState } from 'react';

export default function useCountdown(iso) {
    const target = new Date(iso).getTime();
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const diff = Math.max(0, target - now);
    const s = Math.floor(diff / 1000);
    return {
        done: diff === 0,
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        minutes: Math.floor((s % 3600) / 60),
        seconds: s % 60,
        totalHours: s / 3600,
    };
}
