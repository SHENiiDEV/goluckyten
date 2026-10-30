import { useEffect, useState } from 'react';
import PrizeArt from './PrizeArt';

/** Photo with a graceful fallback to the gold illustration when the file is missing. */
export default function Media({ src, category, title, className = '', imgClassName = '' }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);

    if (!src || failed) {
        return <PrizeArt category={category} title={title} className={className} />;
    }
    return (
        <img
            src={src}
            alt={title ?? ''}
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover ${className} ${imgClassName}`}
        />
    );
}
