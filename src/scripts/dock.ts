// A bar docked to the bottom of a phone screen covers the end of the page (the footer links). While it is docked and
// showing, pad the page by the bar's own height, which varies with language and screen width.
export function reserveSpaceUnder(el: HTMLElement, name: string) {
  const update = () => {
    const r = el.getBoundingClientRect();
    const docked = r.height > 0 && Math.abs(r.bottom - innerHeight) < 2;
    document.documentElement.style.setProperty(`--dock-${name}`, docked ? `${Math.ceil(r.height)}px` : '0px');
  };
  new ResizeObserver(update).observe(el);
  addEventListener('resize', update);
}
