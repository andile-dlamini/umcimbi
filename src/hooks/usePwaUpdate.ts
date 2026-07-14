import { useRegisterSW } from "virtual:pwa-register/react";

const hasServiceWorker =
  typeof navigator !== "undefined" && "serviceWorker" in navigator;

export function usePwaUpdate(): { needRefresh: boolean; refresh: () => void } {
  if (!hasServiceWorker) {
    return { needRefresh: false, refresh: () => {} };
  }

  // Safe: hasServiceWorker is a module-level constant, so hook order is stable.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return {
    needRefresh,
    refresh: () => {
      void updateServiceWorker(true);
    },
  };
}
