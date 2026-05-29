import { useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  ReceiptText,
  CircleCheck,
  ShieldCheck,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react';

type Align = 'left' | 'right';

interface Step {
  role: string;
  roleColor: string;
  bg: string;
  border: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
  align: Align;
}

const STEPS: Step[] = [
  {
    role: 'Organiser',
    roleColor: '#D85A30',
    bg: '#FEF7F4',
    border: '#F5C4B3',
    Icon: Sparkles,
    title: 'Pick your ceremony',
    desc: 'Create your ceremony event',
    align: 'left',
  },
  {
    role: 'Organiser',
    roleColor: '#D85A30',
    bg: '#FEF7F4',
    border: '#F5C4B3',
    Icon: Search,
    title: 'Find and request vendors',
    desc: 'Browse verified vendors near you. Send a service request directly from their profile.',
    align: 'right',
  },
  {
    role: 'Vendor',
    roleColor: '#0F6E56',
    bg: '#F0FAF6',
    border: '#9FE1CB',
    Icon: ReceiptText,
    title: 'Vendor responds with a quote',
    desc: 'The vendor receives your request, chats with you for more information, then sends a formal quotation — all inside the app.',
    align: 'left',
  },
  {
    role: 'Organiser',
    roleColor: '#D85A30',
    bg: '#FEF7F4',
    border: '#F5C4B3',
    Icon: CircleCheck,
    title: 'Compare and accept',
    desc: 'Review quotes side by side. Accept the best one for you. Your booking is confirmed once the deposit has been paid.',
    align: 'right',
  },
  {
    role: 'UMCIMBI',
    roleColor: '#185FA5',
    bg: '#EEF4FD',
    border: '#B5D4F4',
    Icon: ShieldCheck,
    title: 'Payment held securely',
    desc: 'Deposit paid immediately to vendor to confirm the booking. Balance held safely by UMCIMBI and released only once your ceremony is done.',
    align: 'left',
  },
  {
    role: 'Both parties',
    roleColor: '#534AB7',
    bg: '#F5F4FF',
    border: '#AFA9EC',
    Icon: PartyPopper,
    title: 'Ceremony done',
    desc: 'Vendor uploads proof of delivery, the organiser marks the job as complete. The balance is paid straight to the vendor. Leave a review for your community.',
    align: 'right',
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const iconRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const draw = () => {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return;

      const cRect = container.getBoundingClientRect();
      svg.setAttribute('width', String(cRect.width));
      svg.setAttribute('height', String(cRect.height));
      svg.setAttribute('viewBox', `0 0 ${cRect.width} ${cRect.height}`);

      const icons = iconRefs.current.filter((el): el is HTMLDivElement => !!el);
      let d = '';
      for (let i = 0; i < icons.length - 1; i++) {
        const a = icons[i].getBoundingClientRect();
        const b = icons[i + 1].getBoundingClientRect();
        const sx = a.left + a.width / 2 - cRect.left;
        const sy = a.bottom - cRect.top;
        const ex = b.left + b.width / 2 - cRect.left;
        const ey = b.top - cRect.top;
        const my = (sy + ey) / 2;
        d += `M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey} `;
      }

      svg.innerHTML = d
        ? `<path d="${d}" stroke="#F0997B" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.6" fill="none" />`
        : '';
    };

    const t = window.setTimeout(draw, 100);
    window.addEventListener('resize', draw);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', draw);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h2 className="font-medium" style={{ color: '#D85A30', fontSize: 26 }}>
          How UMCIMBI works
        </h2>
        <p className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>
          From ceremony idea to celebration — here's the journey
        </p>
      </div>

      <div ref={containerRef} className="relative mx-auto" style={{ maxWidth: 560 }}>
        <svg
          ref={svgRef}
          className="absolute inset-0"
          style={{ zIndex: 0, pointerEvents: 'none' }}
          xmlns="http://www.w3.org/2000/svg"
        />

        <div className="relative space-y-8" style={{ zIndex: 1 }}>
          {STEPS.map((step, i) => {
            const { Icon } = step;
            const isRight = step.align === 'right';
            return (
              <div
                key={i}
                className="flex items-center gap-4"
                style={{
                  maxWidth: '72%',
                  marginLeft: isRight ? 'auto' : undefined,
                  flexDirection: isRight ? 'row-reverse' : 'row',
                }}
              >
                <div
                  ref={(el) => (iconRefs.current[i] = el)}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 16,
                    backgroundColor: step.bg,
                    border: `1px solid ${step.border}`,
                  }}
                >
                  <Icon size={28} color={step.roleColor} strokeWidth={1.75} />
                </div>
                <div className="flex flex-col" style={{ textAlign: isRight ? 'right' : 'left' }}>
                  <span
                    className="uppercase tracking-wider font-semibold"
                    style={{ color: step.roleColor, fontSize: 11 }}
                  >
                    {step.role}
                  </span>
                  <h3 className="font-semibold text-foreground" style={{ fontSize: 15 }}>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-snug mt-1" style={{ fontSize: 13 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
