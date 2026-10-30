import { useState } from 'react';
import Media from './Media';

export default function Gallery({ cover, images = [], video, category, title }) {
    const items = [
        ...(video ? [{ type: 'video', src: video }] : []),
        { type: 'image', src: cover },
        ...images.map((src) => ({ type: 'image', src })),
    ];
    const [active, setActive] = useState(0);
    const current = items[active] ?? items[0];

    return (
        <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-line bg-ink-2">
                <div key={active} className="swap-in h-full w-full">
                {current.type === 'video' ? (
                    <video key={current.src} src={current.src} poster={cover ?? undefined} className="h-full w-full object-cover" autoPlay muted loop playsInline controls={false} onError={() => setActive(1)} />
                ) : (
                    <Media src={current.src} category={category} title={title} />
                )}
                </div>
            </div>
            {items.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {items.map((it, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`pressable relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl border-2 ${i === active ? 'border-violet' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            aria-label={it.type === 'video' ? 'Play video' : `Photo ${i + 1}`}
                        >
                            {it.type === 'video' ? (
                                <>
                                    <Media src={cover} category={category} title="" />
                                    <span className="absolute inset-0 grid place-items-center bg-ink/40 text-gold-hi">▶</span>
                                </>
                            ) : (
                                <Media src={it.src} category={category} title="" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
