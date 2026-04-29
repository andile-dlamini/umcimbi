import { useState, useEffect } from 'react';

const KEYS = {
  planner: 'umcimbi_planner_tour_v1',
  vendor: 'umcimbi_vendor_tour_v1',
} as const;

type TourRole = keyof typeof KEYS;

export function useOnboardingTour(role: TourRole) {
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEYS[role])) {
      const t = setTimeout(() => setTourActive(true), 900);
      return () => clearTimeout(t);
    }
  }, [role]);

  const completeTour = () => {
    localStorage.setItem(KEYS[role], 'done');
    setTourActive(false);
  };

  const replayTour = () => {
    localStorage.removeItem(KEYS[role]);
    setTourActive(true);
  };

  return { tourActive, completeTour, replayTour };
}

// Exported so Settings page can clear and re-trigger tours by navigating back
export function clearTour(role: TourRole) {
  localStorage.removeItem(KEYS[role]);
}
