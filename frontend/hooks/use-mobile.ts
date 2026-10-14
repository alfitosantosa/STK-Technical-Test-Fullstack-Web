import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY)
  mediaQuery.addEventListener("change", onChange)
  return () => mediaQuery.removeEventListener("change", onChange)
}

export function useIsMobile() {
  // useSyncExternalStore dipakai supaya browser langsung mendapat nilai yang
  // benar tanpa setState di dalam effect, dan server tetap memakai nilai awal
  // yang sama (false) sehingga tidak ada perbedaan saat hydration.
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  )
}
