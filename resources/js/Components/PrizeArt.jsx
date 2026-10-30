import { useId } from 'react';

/*
 * Line-art prize illustrations drawn in gilt on a spotlight.
 * Used whenever a raffle has no uploaded photo.
 */
const drawings = {
    cars: (
        <g>
            <path d="M52 196c6-26 22-40 52-46l46-30c18-12 38-16 64-16h40c30 0 52 10 74 30l24 20c22 4 34 14 38 30l2 14c0 6-4 10-10 10h-22" />
            <path d="M96 208H66c-8 0-14-6-14-12" />
            <path d="M154 208h108" />
            <circle cx="126" cy="208" r="26" />
            <circle cx="126" cy="208" r="11" />
            <circle cx="294" cy="208" r="26" />
            <circle cx="294" cy="208" r="11" />
            <path d="M150 150l34-24c10-6 20-8 32-8h20v32z" />
            <path d="M252 118h14c16 0 30 6 42 18l12 14h-68z" />
            <path d="M204 168h16" />
            <path d="M40 236h330" opacity=".35" />
        </g>
    ),
    watches: (
        <g>
            <path d="M176 70l6-34h36l6 34" />
            <path d="M176 230l6 34h36l6-34" />
            <circle cx="200" cy="150" r="78" />
            <circle cx="200" cy="150" r="64" />
            <path d="M278 140h10v20h-10" />
            {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * Math.PI) / 6;
                const r1 = i % 3 === 0 ? 48 : 54;
                return (
                    <line key={i} x1={200 + Math.sin(a) * r1} y1={150 - Math.cos(a) * r1} x2={200 + Math.sin(a) * 60} y2={150 - Math.cos(a) * 60} />
                );
            })}
            <circle cx="200" cy="178" r="12" opacity=".7" />
            <path d="M200 150l-20-26" />
            <path d="M200 150l32 10" />
            <circle cx="200" cy="150" r="3" fill="currentColor" />
        </g>
    ),
    cash: (
        <g>
            <rect x="90" y="96" width="220" height="112" rx="10" transform="rotate(-8 200 152)" opacity=".45" />
            <rect x="96" y="104" width="220" height="112" rx="10" />
            <rect x="110" y="118" width="192" height="84" rx="6" opacity=".6" />
            <circle cx="206" cy="160" r="26" />
            <path d="M214 148c-4-4-14-5-18 0-6 6-6 18 0 24 4 5 14 4 18 0M188 156h20M188 164h20" />
            <circle cx="132" cy="160" r="5" />
            <circle cx="280" cy="160" r="5" />
            <ellipse cx="300" cy="236" rx="34" ry="10" />
            <path d="M266 236v-10M334 236v-10" />
            <ellipse cx="300" cy="226" rx="34" ry="10" />
            <ellipse cx="300" cy="216" rx="34" ry="10" />
        </g>
    ),
    travel: (
        <g>
            <path d="M40 220c40-12 80-12 120 0s80 12 120 0 60-10 80-6" />
            <path d="M60 244c34-8 70-8 104 0s70 8 104 0" opacity=".5" />
            <path d="M178 220c4-50 0-96-18-136" />
            <path d="M160 84c-26-6-50 4-64 22 22-8 44-8 64-2" />
            <path d="M160 84c18-20 44-24 66-14-22 2-44 10-62 20" />
            <path d="M162 88c-16 14-24 36-20 60 8-22 18-40 28-52" />
            <path d="M164 86c22 2 42 16 50 38-16-14-32-22-48-26" />
            <circle cx="292" cy="98" r="26" />
            <path d="M250 150h88v26h-88z" />
            <path d="M244 150l50-22 50 22" />
            <path d="M262 176v44M326 176v44" />
        </g>
    ),
    tech: (
        <g>
            <rect x="96" y="70" width="208" height="128" rx="8" />
            <rect x="108" y="82" width="184" height="104" rx="2" opacity=".5" />
            <path d="M70 206h260l-12 20H82z" />
            <path d="M180 214h40" />
            <path d="M128 160l30-36 26 22 34-44 38 58" opacity=".7" />
            <circle cx="262" cy="110" r="8" opacity=".7" />
            <rect x="320" y="120" width="34" height="92" rx="6" />
            <circle cx="337" cy="150" r="10" />
            <circle cx="337" cy="190" r="6" />
        </g>
    ),
    jewellery: (
        <g>
            <path d="M140 110h120l36 40-96 100-96-100z" />
            <path d="M104 150h192" />
            <path d="M140 110l24 40 36-40 36 40 24-40" />
            <path d="M164 150l36 100 36-100" />
            <path d="M200 56v20M156 70l10 14M244 70l-10 14" opacity=".7" />
            <path d="M80 98l-12-4M320 98l12-4" opacity=".5" />
        </g>
    ),
    home: (
        <g>
            <path d="M80 236V138l120-80 120 80v98" />
            <path d="M60 150l140-94 140 94" />
            <rect x="174" y="168" width="52" height="68" rx="2" />
            <circle cx="214" cy="204" r="3" fill="currentColor" />
            <rect x="104" y="160" width="44" height="40" rx="2" />
            <rect x="252" y="160" width="44" height="40" rx="2" />
            <path d="M126 160v40M104 180h44M274 160v40M252 180h44" opacity=".6" />
            <path d="M262 92V64h24v44" />
            <path d="M40 236h320" opacity=".35" />
        </g>
    ),
};

export default function PrizeArt({ category, imageUrl, title, className = '', tone = 'gold' }) {
    const id = useId().replace(/:/g, '');

    if (imageUrl) {
        return <img src={imageUrl} alt={title ?? ''} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
    }

    const stroke = tone === 'jade' ? '#8fd9c1' : `url(#g${id})`;

    return (
        <svg viewBox="0 0 400 300" className={`h-full w-full ${className}`} role="img" aria-label={title ?? category}>
            <defs>
                <radialGradient id={`s${id}`} cx="50%" cy="38%" r="70%">
                    <stop offset="0" stopColor="#3a2a66" />
                    <stop offset=".55" stopColor="#1d1530" />
                    <stop offset="1" stopColor="#0f0b17" />
                </radialGradient>
                <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#e3dbff" />
                    <stop offset=".5" stopColor="#a48bff" />
                    <stop offset="1" stopColor="#6a4cf0" />
                </linearGradient>
                <pattern id={`p${id}`} width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r=".8" fill="#a48bff" opacity=".14" />
                </pattern>
            </defs>
            <rect width="400" height="300" fill={`url(#s${id})`} />
            <rect width="400" height="300" fill={`url(#p${id})`} />
            <g fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" color="#a48bff">
                {drawings[category] ?? drawings.cash}
            </g>
        </svg>
    );
}
