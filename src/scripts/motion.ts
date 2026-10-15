import { prefersReducedMotion, onIdle } from './lazy';

const EASE = [0.22, 1, 0.36, 1] as const;

function setFinalCounters() {
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
    el.textContent = `${el.dataset.counter}${el.dataset.suffix ?? ''}`;
  });
}

async function init() {
  if (prefersReducedMotion()) { setFinalCounters(); return; }

  const [{ animate, scroll, inView, stagger }, { default: Lenis }] = await Promise.all([import('motion'), import('lenis')]);

  const lenis = new Lenis({ lerp: 0.1, autoRaf: true });
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
    });
  });

  const vh = window.innerHeight;
  const belowFold = (el: Element) => el.getBoundingClientRect().top > vh * 0.9;

  // Reveals — never hide what is already on screen (protects LCP)
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (!belowFold(el)) return;
    const targets = el.dataset.reveal === 'lines' ? [...el.querySelectorAll<HTMLElement>('.line')] : [el];
    animate(targets, { opacity: 0, y: 28 }, { duration: 0 });
    let done = false;
    inView(el, () => {
      if (done) return;
      done = true;
      animate(targets, { opacity: 1, y: 0 }, { duration: 1.1, ease: EASE, delay: stagger(0.08) });
    }, { margin: '0px 0px -15% 0px' });
  });

  // Hero copy fades and lifts as the hero scrolls away
  document.querySelectorAll<HTMLElement>('[data-hero-copy]').forEach((el) => {
    const section = el.closest('section') ?? el;
    scroll(animate(el, { opacity: [1, 0], y: [0, -80] }, { ease: 'linear' }), { target: section, offset: ['start start', 'end start'] });
  });

  // Gentle image parallax
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    scroll(animate(el, { y: [-30, 30] }, { ease: 'linear' }), { target: el, offset: ['start end', 'end start'] });
  });

  // Counters
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
    const end = Number(el.dataset.counter);
    const suffix = el.dataset.suffix ?? '';
    el.textContent = `0${suffix}`;
    let done = false;
    inView(el, () => {
      if (done) return;
      done = true;
      animate(0, end, { duration: 1.6, ease: EASE, onUpdate: (v) => { el.textContent = `${Math.round(v)}${suffix}`; } });
    });
  });

  // Sticky farm-to-port story (desktop only; CSS makes the track tall and the inner block sticky)
  if (window.matchMedia('(min-width: 1024px)').matches) {
    document.querySelectorAll<HTMLElement>('[data-pin]').forEach((track) => {
      const steps = [...track.querySelectorAll<HTMLElement>('[data-pin-step]')];
      steps.forEach((s, i) => { s.style.opacity = i === 0 ? '1' : '0.2'; });
      scroll((progress: number) => {
        const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));
        steps.forEach((s, i) => {
          const target = i === active ? 1 : i < active ? 0.35 : 0.2;
          if (s.style.opacity !== String(target)) animate(s, { opacity: target, y: i === active ? 0 : i < active ? -6 : 6 }, { duration: 0.6, ease: EASE });
        });
      }, { target: track, offset: ['start start', 'end end'] });
    });
  }

  // Map routes draw in
  document.querySelectorAll<SVGSVGElement>('svg:has([data-draw])').forEach((svg) => {
    const paths = [...svg.querySelectorAll<SVGPathElement>('[data-draw]')];
    paths.forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = `${len}`; p.style.strokeDashoffset = `${len}`; });
    let done = false;
    inView(svg, () => {
      if (done) return;
      done = true;
      paths.forEach((p, i) => animate(p, { strokeDashoffset: 0 }, { duration: 1.4, delay: (i % 12) * 0.08, ease: EASE }));
    }, { amount: 0.3 });
  });
}

onIdle(() => { void init(); });
