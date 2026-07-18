/** Prefix public asset paths with Vite base (required for GitHub Pages). */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}
