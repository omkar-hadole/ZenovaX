import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { SECTIONS } from '../data/termsAndConditions';

const stripNumber = (title) => String(title).replace(/^\d+\.\s*/, '');

function renderInline(text) {
    const parts = String(text).split('**');
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

// Spacing applied between blocks on a leaf. Must match the `mb-4` used in renderLeafContent.
const GAP = 16;

// Flat ordered list of every renderable entry (sections, blocks, ack).
const ITEMS = [];
SECTIONS.forEach((section, si) => {
    ITEMS.push({ id: `section-${si}`, type: 'section', section, sectionIndex: si });
    section.items.forEach((block, bi) => {
        ITEMS.push({ id: `block-${si}-${bi}`, type: 'block', block });
    });
});
ITEMS.push({ id: 'ack', type: 'ack' });

function renderEntry(entry) {
    if (entry.type === 'section') {
        return (
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 pb-3 border-b border-blue-100 dark:border-blue-500/20">
                {entry.section.title}
            </h2>
        );
    }
    if (entry.type === 'block') {
        return renderBlock(entry.block);
    }
    if (entry.type === 'ack') {
        return (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-center space-y-3">
                <p className="font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-widest text-xs">
                    Acknowledgment
                </p>
                <p className="text-sm">
                    By using ZenovaX, you acknowledge that you have read, understood, and agree to be bound by these
                    Terms &amp; Conditions. You also acknowledge that you have had the opportunity to seek independent
                    legal advice and have not relied on any representation or warranty not expressly set forth in
                    these Terms.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                    © 2026 ZenovaX. All rights reserved.
                </p>
            </div>
        );
    }
    return null;
}

function renderLeafContent(entries) {
    return entries.map((entry) => (
        <div key={entry.id} className="mb-4">{renderEntry(entry)}</div>
    ));
}

function ContentsLeaf({ onGo }) {
    return (
        <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Contents</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Tap an entry to flip to that section.</p>
            <ol className="space-y-1.5">
                {SECTIONS.map((section, i) => (
                    <li key={i}>
                        <button
                            onClick={() => onGo(i)}
                            className="group flex items-baseline gap-2 py-1 text-left w-full text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <span className="text-[11px] font-bold text-blue-500/80 tabular-nums">{i + 1}.</span>
                            <span className="text-[11px] font-semibold uppercase tracking-wider">
                                {stripNumber(section.title)}
                            </span>
                            <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600 translate-y-[-3px]" />
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}

function renderBlock(block, key) {
    if (block.h) {
        return <h3 key={key} className="font-semibold text-gray-800 dark:text-gray-200 text-[15px]">{renderInline(block.h)}</h3>;
    }
    if (block.intro) {
        return <p key={key} className="text-[14px] leading-relaxed">{renderInline(block.intro)}</p>;
    }
    if (block.p) {
        return <p key={key} className="text-[14px] leading-relaxed">{renderInline(block.p)}</p>;
    }
    if (block.ul) {
        return (
            <ul key={key} className="list-disc pl-5 space-y-1.5 text-[14px] leading-relaxed">
                {block.ul.map((li, j) => <li key={j}>{renderInline(li)}</li>)}
            </ul>
        );
    }
    if (block.ol) {
        return (
            <ol key={key} className="list-decimal pl-5 space-y-1.5 text-[14px] leading-relaxed">
                {block.ol.map((li, j) => <li key={j}>{renderInline(li)}</li>)}
            </ol>
        );
    }
    if (block.table) {
        return (
            <div key={key} className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-blue-50/60 dark:bg-blue-500/10">
                            {block.table.head.map((h, j) => (
                                <th key={j} className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">{renderInline(h)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {block.table.rows.map((row, j) => (
                            <tr key={j}>
                                {row.map((cell, k) => (
                                    <td key={k} className="px-3 py-2 align-top">{renderInline(cell)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    return null;
}

// Pack measured items into leaves that fit `contentH`. Keeps a section heading with its first block.
function packLeaves(heights, contentH) {
    const leaves = [[]];
    const sectionLeaf = [];
    let current = 0;
    let used = 0;
    ITEMS.forEach((item, i) => {
        const h = heights[i] || 0;
        const needs = item.type === 'section'
            ? h + (heights[i + 1] || 0) + GAP
            : h;
        if (used > 0 && used + needs > contentH) {
            leaves.push([]);
            current++;
            used = 0;
        }
        if (item.type === 'section') sectionLeaf[item.sectionIndex] = current;
        leaves[current].push(item);
        used += h + GAP;
    });
    return { leaves, sectionLeaf };
}

/* ---------------------------------------------------------------------- */
/* Paper page (one leaf/half)                                              */
/* ---------------------------------------------------------------------- */

function PaperLeaf({ side, pageNumber, children }) {
    const isLeft = side === 'left';
    return (
        <div
            className={`relative bg-[#f4f4f1] dark:bg-gray-900 ${isLeft ? 'rounded-l-xl' : 'rounded-r-xl'} min-h-[calc(100dvh-13rem)] max-h-[calc(100dvh-13rem)] overflow-y-auto px-6 py-8 md:px-9 md:py-10 text-gray-600 dark:text-gray-300`}
        >
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.08]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, rgba(120,110,90,0.035) 0px, transparent 1px, transparent 3px)',
                }}
            />
            <div
                className={`absolute inset-y-0 ${isLeft ? 'right-0' : 'left-0'} w-10 pointer-events-none`}
                style={{
                    background: isLeft
                        ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.06))'
                        : 'linear-gradient(to left, transparent, rgba(0,0,0,0.06))',
                }}
            />
            <div className="relative">{children}</div>
            {pageNumber != null && (
                <div
                    className={`absolute bottom-3 ${isLeft ? 'left-6' : 'right-6'} text-[11px] text-gray-300 dark:text-gray-600 tabular-nums`}
                >
                    {pageNumber}
                </div>
            )}
        </div>
    );
}

/* ---------------------------------------------------------------------- */
/* Book cover                                                              */
/* ---------------------------------------------------------------------- */

function BookCover({ onOpen }) {
    return (
        <div
            className="relative min-h-[calc(100dvh-13rem)] rounded-r-xl rounded-l-md overflow-hidden shadow-2xl cursor-pointer select-none group"
            style={{
                background:
                    'radial-gradient(120% 140% at 12% 8%, #1e3a8a 0%, #172554 42%, #0b1130 78%, #070a1f 100%)',
            }}
            onClick={onOpen}
            role="button"
            tabIndex={0}
            aria-label="Open Terms & Conditions"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
        >
            <div
                className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, #fff 0px, transparent 1px, transparent 3px), repeating-linear-gradient(-45deg, #fff 0px, transparent 1px, transparent 3px)',
                }}
            />
            <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/50 to-transparent" />
            <div className="absolute inset-y-3 right-0 w-2 flex flex-col gap-[2px] pr-0.5">
                {Array.from({ length: 26 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-blue-50/90" style={{ opacity: 0.55 + (i % 3) * 0.12 }} />
                ))}
            </div>
            <div
                className="absolute -top-1 right-10 w-6 h-20 bg-gradient-to-b from-amber-400 to-amber-600 shadow-md"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }}
            />
            <div className="relative h-full flex flex-col items-center justify-center text-center px-8 py-20 gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center">
                    <FileText className="w-8 h-8 text-blue-100" />
                </div>
                <div className="space-y-3">
                    <p className="text-blue-300/70 text-[11px] font-semibold uppercase tracking-[0.35em]">
                        The ZenovaX Handbook
                    </p>
                    <h1
                        className="font-serif text-4xl md:text-5xl text-blue-50 tracking-wide"
                        style={{ textShadow: '0 1px 0 rgba(255,255,255,0.12), 0 2px 10px rgba(0,0,0,0.45)' }}
                    >
                        Terms &amp; Conditions
                    </h1>
                    <div className="flex items-center justify-center gap-3 pt-1">
                        <span className="h-px w-10 bg-blue-400/40" />
                        <p className="text-blue-200/60 text-xs tracking-widest uppercase">Est. 2026</p>
                        <span className="h-px w-10 bg-blue-400/40" />
                    </div>
                </div>
                <button
                    onClick={onOpen}
                    className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-50 text-blue-950 text-sm font-semibold shadow-lg hover:bg-white group-hover:-translate-y-0.5 transition-all"
                >
                    <BookOpen className="w-4 h-4" />
                    Open the book
                </button>
                <p className="text-blue-300/50 text-[11px] tracking-wide">Tap the cover, or press Enter</p>
            </div>
        </div>
    );
}

/* ---------------------------------------------------------------------- */
/* The single moving page (realistic page flip)                            */
/* ---------------------------------------------------------------------- */

function FlipPage({ dir, front, back, onDone }) {
    const isNext = dir === 'next';
    return (
        <div
            aria-hidden="true"
            className={`flip-sheet ${isNext ? 'flip-next' : 'flip-prev'}`}
            onAnimationEnd={(e) => {
                if (e.target === e.currentTarget) onDone();
            }}
        >
            <div className="flip-face flip-front">{front}</div>
            <div className="flip-face flip-back">{back}</div>
        </div>
    );
}

function BackCoverPlaceholder() {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-2 opacity-40">
            <FileText className="w-6 h-6" />
            <p className="text-xs uppercase tracking-widest">ZenovaX</p>
        </div>
    );
}

/* ---------------------------------------------------------------------- */
/* Main component                                                          */
/* ---------------------------------------------------------------------- */

export default function TermsAndConditions() {
    const [opened, setOpened] = useState(false);
    const [spread, setSpread] = useState(0);
    const [packed, setPacked] = useState(null);
    const [flipping, setFlipping] = useState(null); // { dir: 'next'|'prev', target }
    const [flipToken, setFlipToken] = useState(0); // bumped per flip so FlipPage remounts & re-animates
    const measureRootRef = useRef(null);
    const queueRef = useRef([]); // pending 'next'/'prev' directions

    // Refs mirror state so the flip handlers can read current values without stale closures.
    const spreadRef = useRef(spread);
    const flippingRef = useRef(flipping);
    useEffect(() => {
        spreadRef.current = spread;
    }, [spread]);
    useEffect(() => {
        flippingRef.current = flipping;
    }, [flipping]);

    const totalLeaves = packed ? packed.leaves.length : 0;
    const totalSpreads = Math.ceil(totalLeaves / 2);

    // Measure every block at the real leaf width, then pack them into fixed-height leaves.
    const compute = useCallback(() => {
        const root = measureRootRef.current;
        if (!root) return;
        const heights = [];
        root.querySelectorAll('[data-item-idx]').forEach((el) => {
            const idx = Number(el.getAttribute('data-item-idx'));
            heights[idx] = el.getBoundingClientRect().height;
        });
        const leafH = window.innerHeight - 13 * 16;
        const pad = window.matchMedia('(min-width: 768px)').matches ? 80 : 64;
        const contentH = leafH - pad - 24;
        setPacked(packLeaves(heights, contentH));
    }, []);

    useLayoutEffect(() => {
        compute();
    }, [compute]);

    useEffect(() => {
        let t;
        const onResize = () => {
            clearTimeout(t);
            t = setTimeout(compute, 150);
        };
        window.addEventListener('resize', onResize);
        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', onResize);
        };
    }, [compute]);

    const openBook = useCallback(() => {
        setOpened(true);
    }, []);

    const beginFlip = useCallback((flip) => {
        setFlipToken((t) => t + 1);
        setFlipping(flip);
    }, []);

    // Called when a page turn finishes: commit the new spread, then start the next queued turn.
    const commitFlip = useCallback(() => {
        const f = flippingRef.current;
        if (!f) return;
        spreadRef.current = f.target;
        setSpread(f.target);
        setFlipping(null);
        const dir = queueRef.current.shift();
        if (!dir) return;
        const s = spreadRef.current;
        if (dir === 'next' && s < totalSpreads - 1) {
            beginFlip({ dir: 'next', target: s + 1 });
        } else if (dir === 'prev' && s > 0) {
            beginFlip({ dir: 'prev', target: s - 1 });
        }
    }, [totalSpreads, beginFlip]);

    // Safety net in case animationend never fires (hidden tab, etc.).
    useEffect(() => {
        if (!flipping) return;
        const t = setTimeout(commitFlip, 850);
        return () => clearTimeout(t);
    }, [flipping, commitFlip]);

    const next = useCallback(() => {
        const s = spreadRef.current;
        if (s >= totalSpreads - 1) return;
        if (flippingRef.current) {
            if (queueRef.current.length < 10) queueRef.current.push('next');
            return;
        }
        beginFlip({ dir: 'next', target: s + 1 });
    }, [totalSpreads, beginFlip]);

    const prev = useCallback(() => {
        const s = spreadRef.current;
        if (s <= 0) return;
        if (flippingRef.current) {
            if (queueRef.current.length < 10) queueRef.current.push('prev');
            return;
        }
        beginFlip({ dir: 'prev', target: s - 1 });
    }, [beginFlip]);

    // goTo takes a SECTION index and flips one page in the right direction toward that section.
    const goTo = useCallback((sectionIndex) => {
        if (!packed) return;
        const leafIndex = packed.sectionLeaf[sectionIndex] ?? 0;
        const target = Math.min(Math.max(Math.floor(leafIndex / 2), 0), totalSpreads - 1);
        const s = spreadRef.current;
        if (flippingRef.current || target === s) return;
        queueRef.current = [];
        beginFlip({ dir: target > s ? 'next' : 'prev', target });
    }, [packed, totalSpreads, beginFlip]);

    useEffect(() => {
        const handler = (e) => {
            if (!opened) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') openBook();
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'PageDown') next();
            if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [opened, openBook, next, prev]);

    const leafAt = (i) => (packed && i < totalLeaves ? packed.leaves[i] : null);

    const renderSide = (s, side) => {
        if (side === 'left') {
            return s === 0 ? <ContentsLeaf onGo={goTo} /> : renderLeafContent(leafAt(s * 2));
        }
        const leaf = leafAt(s * 2 + 1);
        return leaf ? renderLeafContent(leaf) : <BackCoverPlaceholder />;
    };

    const spineOverlay = (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-8 -translate-x-1/2">
            <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.10))' }} />
            <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.10))' }} />
            <div className="absolute inset-y-0 left-1/2 w-px bg-black/10 dark:bg-black/40 -translate-x-1/2" />
        </div>
    );

    const baseLeafs = flipping
        ? (flipping.dir === 'next'
            ? (
                <>
                    <PaperLeaf side="left" pageNumber={spread * 2 + 1}>{renderSide(spread, 'left')}</PaperLeaf>
                    {spineOverlay}
                    <PaperLeaf side="right" pageNumber={leafAt(flipping.target * 2 + 1) ? flipping.target * 2 + 2 : null}>{renderSide(flipping.target, 'right')}</PaperLeaf>
                </>
            )
            : (
                <>
                    <PaperLeaf side="left" pageNumber={flipping.target * 2 + 1}>{renderSide(flipping.target, 'left')}</PaperLeaf>
                    {spineOverlay}
                    <PaperLeaf side="right" pageNumber={leafAt(spread * 2 + 1) ? spread * 2 + 2 : null}>{renderSide(spread, 'right')}</PaperLeaf>
                </>
            ))
        : (
            <>
                <PaperLeaf side="left" pageNumber={spread * 2 + 1}>{renderSide(spread, 'left')}</PaperLeaf>
                {spineOverlay}
                <PaperLeaf side="right" pageNumber={leafAt(spread * 2 + 1) ? spread * 2 + 2 : null}>{renderSide(spread, 'right')}</PaperLeaf>
            </>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 py-10 px-4">
            
            <div
                aria-hidden="true"
                ref={measureRootRef}
                className="pointer-events-none"
                style={{ position: 'fixed', left: -10000, top: 0, width: '100%' }}
            >
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2">
                        <div className="px-6 py-8 md:px-9 md:py-10 text-gray-600 dark:text-gray-300">
                            {ITEMS.map((item, i) => (
                                <div key={item.id} data-item-idx={i}>{renderEntry(item)}</div>
                            ))}
                        </div>
                        <div />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                <Link
                    to="/auth?mode=signup"
                    className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign Up
                </Link>

                <style>{`
                    @keyframes flipSheetNext { from { transform: rotateY(0deg); } to { transform: rotateY(-180deg); } }
                    @keyframes flipSheetPrev { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }

                    .flip-sheet {
                        position: absolute; top: 0; bottom: 0; width: 50%;
                        transform-style: preserve-3d;
                        -webkit-transform-style: preserve-3d;
                        will-change: transform;
                        z-index: 30;
                        pointer-events: none;
                        background: #efe4cd;
                        box-shadow: 0 0 8px rgba(0,0,0,0.12);
                        border-radius: 3px;
                    }
                    .dark .flip-sheet { background: #2a2a2e; }
                    .flip-sheet.flip-next { left: 50%; transform-origin: left center; animation: flipSheetNext 800ms cubic-bezier(.25,.8,.25,1) forwards; }
                    .flip-sheet.flip-prev { left: 0; transform-origin: right center; animation: flipSheetPrev 800ms cubic-bezier(.25,.8,.25,1) forwards; }

                    .flip-face {
                        position: absolute; inset: 0;
                        backface-visibility: hidden;
                        -webkit-backface-visibility: hidden;
                        background: #f4f4f1;
                    }
                    .dark .flip-face { background: #111827; }
                    .flip-front { transform: translateZ(1px); }
                    .flip-back { transform: rotateY(180deg) translateZ(1px); }

                    .flip-undershadow { position: absolute; inset: 0; pointer-events: none; z-index: 20; opacity: 0; will-change: opacity; }
                    .flip-under-next { background: linear-gradient(90deg, rgba(0,0,0,0) 38%, rgba(15,23,42,0.32) 50%, rgba(15,23,42,0.16) 62%, rgba(0,0,0,0) 100%); animation: flipUnder 800ms cubic-bezier(.25,.8,.25,1) forwards; }
                    .flip-under-prev { background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(15,23,42,0.16) 38%, rgba(15,23,42,0.32) 50%, rgba(0,0,0,0) 62%); animation: flipUnder 800ms cubic-bezier(.25,.8,.25,1) forwards; }

                    @keyframes flipUnder { 0%{opacity:0} 40%{opacity:0.7} 100%{opacity:0.22} }
                `}</style>

                <div className="relative" style={{ perspective: '2200px' }}>
                    <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-gray-200/60 dark:bg-gray-800/60 rounded-r-lg rounded-l-sm" />
                    <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 bg-white/70 dark:bg-gray-900/70 rounded-r-lg rounded-l-sm" />

                    {!opened || !packed ? (
                        <BookCover onOpen={openBook} />
                    ) : (
                        <div className="relative" style={{ perspective: '2200px' }}>
                            <div className="relative grid grid-cols-2 bg-[#f4f4f1] dark:bg-gray-900 rounded-r-xl rounded-l-md border border-gray-100 dark:border-gray-800 shadow-2xl">
                                {baseLeafs}
                            </div>

                            {flipping && <div key={`under-${flipToken}`} className={`flip-undershadow flip-under-${flipping.dir}`} />}

                            {flipping && (
                                <FlipPage
                                    key={flipToken}
                                    dir={flipping.dir}
                                    front={flipping.dir === 'next'
                                        ? <PaperLeaf side="right" pageNumber={spread * 2 + 2}>{renderSide(spread, 'right')}</PaperLeaf>
                                        : <PaperLeaf side="left" pageNumber={spread * 2 + 1}>{renderSide(spread, 'left')}</PaperLeaf>}
                                    back={flipping.dir === 'next'
                                        ? <PaperLeaf side="left" pageNumber={flipping.target * 2 + 1}>{renderSide(flipping.target, 'left')}</PaperLeaf>
                                        : <PaperLeaf side="right" pageNumber={leafAt(flipping.target * 2 + 1) ? flipping.target * 2 + 2 : null}>{renderSide(flipping.target, 'right')}</PaperLeaf>}
                                    onDone={commitFlip}
                                />
                            )}

                            <button
                                onClick={prev}
                                disabled={spread === 0}
                                aria-label="Previous spread"
                                className="absolute left-0 top-0 bottom-0 w-10 cursor-pointer disabled:cursor-default focus:outline-none"
                            />
                            <button
                                onClick={next}
                                disabled={spread === totalSpreads - 1}
                                aria-label="Next spread"
                                className="absolute right-0 top-0 bottom-0 w-10 cursor-pointer disabled:cursor-default focus:outline-none"
                            />
                        </div>
                    )}
                </div>

                {opened && packed && (
                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={prev}
                            disabled={spread === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <div className="text-center">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 tabular-nums">
                                Pages {spread * 2 + 1}
                                {leafAt(spread * 2 + 1) ? `\u2013${spread * 2 + 2}` : ''} of {totalLeaves}
                            </span>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Use ← → arrow keys to flip</p>
                        </div>

                        <button
                            onClick={next}
                            disabled={spread === totalSpreads - 1}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
