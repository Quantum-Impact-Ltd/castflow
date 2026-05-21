/**
 * Visually hidden until focused — pressing Tab once after page load reveals
 * a "Skip to content" link that jumps past the nav into the main content
 * region. Pairs with the `#main-content` anchor rendered at the top of
 * `app/layout.tsx`'s render tree.
 *
 * Server component — no React state needed. The "becomes visible on focus"
 * behaviour is pure CSS.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#f9a26c]"
    >
      Skip to content
    </a>
  )
}
