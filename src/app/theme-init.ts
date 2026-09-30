/**
 * Theme bootstrap.
 *
 * Runs while the server-rendered HTML is still being parsed, so <html> already
 * carries the right `light`/`dark` class before React paints — no flash of the
 * wrong theme.
 *
 * It is rendered by RootLayout through <div dangerouslySetInnerHTML> instead of
 * a React <script> element: React 19 logs "Encountered a script tag while
 * rendering React component. Scripts inside React components are never
 * executed when rendering on the client." for every script a component creates
 * on the client (HMR reloads, error-boundary resets, client navigations).
 * A parser-inserted script inside a div executes normally and stays invisible
 * to React's element tree.
 *
 * The client-side counterpart lives in src/context/ThemeContext.tsx, which
 * re-applies the same class from state after hydration.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme")||"system";var d=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):(t==="dark"?"dark":"light");var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(d);r.style.colorScheme=d}catch(e){}})();`;
