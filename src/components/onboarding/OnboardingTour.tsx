import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface TourStep {
  target: string;
  // 'center' = floating modal (no spotlight)
  // 'right'  = tooltip opens to the right of the element (use for sidebar items)
  // 'bottom' = tooltip opens below the element
  // 'top'    = tooltip opens above the element
  placement: 'center' | 'right' | 'bottom' | 'top';
  title: string;
  body: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
}

const PAD = 10;

function getSpot(selector: string): DOMRect | null {
  if (selector === 'center') return null;
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

export function OnboardingTour({ steps, onComplete }: OnboardingTourProps) {
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState<DOMRect | null>(null);

  const step = steps[index];

  const measure = useCallback(() => {
    setSpot(getSpot(step.target));
  }, [step.target]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    if (step.target !== 'center') {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(measure, 420);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const next = () =>
    index < steps.length - 1 ? setIndex(i => i + 1) : onComplete();
  const prev = () => { if (index > 0) setIndex(i => i - 1); };

  const highlight = spot
    ? { x: spot.left - PAD, y: spot.top - PAD, w: spot.width + PAD * 2, h: spot.height + PAD * 2 }
    : null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CARD_W = Math.min(320, vw - 32);
  const CARD_H_APPROX = 260;

  function cardStyle(): React.CSSProperties {
    const base: React.CSSProperties = { position: 'fixed', width: CARD_W, zIndex: 10001 };

    if (!highlight || step.placement === 'center') {
      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const cx = highlight.x + highlight.w / 2;
    const cy = highlight.y + highlight.h / 2;
    const safeLeft = (l: number) =>
      Math.min(Math.max(l, 16), vw - CARD_W - 16);

    switch (step.placement) {
      case 'right': {
        const left = Math.min(highlight.x + highlight.w + 16, vw - CARD_W - 16);
        const top = Math.min(Math.max(cy - CARD_H_APPROX / 2, 16), vh - CARD_H_APPROX - 16);
        return { ...base, left, top };
      }
      case 'top': {
        const idealTop = highlight.y - CARD_H_APPROX - 16;
        const top = idealTop < 16
          ? Math.min(highlight.y + highlight.h + 16, vh - CARD_H_APPROX - 16)
          : idealTop;
        return { ...base, top, left: safeLeft(cx - CARD_W / 2) };
      }
      case 'bottom':
      default: {
        const idealTop = highlight.y + highlight.h + 16;
        const top = idealTop + CARD_H_APPROX > vh
          ? Math.max(highlight.y - CARD_H_APPROX - 16, 16)
          : idealTop;
        return { ...base, top, left: safeLeft(cx - CARD_W / 2) };
      }
    }
  }

  const isLast = index === steps.length - 1;

  return createPortal(
    <>
      {/* Dimmed overlay with spotlight cut-out via SVG mask */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 10000, pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-spotlight">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlight && (
              <rect x={highlight.x} y={highlight.y} width={highlight.w} height={highlight.h} rx="12" ry="12" fill="black" />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tour-spotlight)" />
        {highlight && (
          <rect
            x={highlight.x}
            y={highlight.y}
            width={highlight.w}
            height={highlight.h}
            rx="12"
            ry="12"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Tooltip card */}
      <div
        style={cardStyle()}
        className="rounded-xl bg-card border border-border shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Progress dots + close */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`block h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-primary' : i < index ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onComplete}
            aria-label="Skip tour"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-1">
          Step {index + 1} of {steps.length}
        </p>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          {step.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {step.body}
        </p>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={prev}
            disabled={index === 0}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button
            onClick={next}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isLast ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Let's go!
              </>
            ) : (
              <>
                Next <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
