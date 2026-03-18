import type Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function scrollToHash(href: string) {
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(href, { duration: 1.2 });
  } else {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  }
}
