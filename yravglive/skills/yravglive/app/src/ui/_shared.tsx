// Small helpers shared by our own items. Each item keeps its CSS next to its markup and injects it once.
import { useEffect, useInsertionEffect, useState } from "react";

const injected = new Set<string>();

/** Inject a stylesheet once per document, keyed by id. */
export function useCss(id: string, css: string) {
  useInsertionEffect(() => {
    if (injected.has(id) || document.getElementById(`css-${id}`)) return;
    injected.add(id);
    const el = document.createElement("style");
    el.id = `css-${id}`;
    el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** True while the user (or the gallery's Reduce motion switch) asks for less motion. */
export function useReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const read = () => matchMedia(query).matches || document.documentElement.dataset.reduce === "1";
  const [reduced, setReduced] = useState(read);
  useEffect(() => {
    const mq = matchMedia(query);
    const update = () => setReduced(read());
    mq.addEventListener("change", update);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduce"] });
    return () => { mq.removeEventListener("change", update); obs.disconnect(); };
  }, []);
  return reduced;
}

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");
