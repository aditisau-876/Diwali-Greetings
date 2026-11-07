import { useSyncExternalStore } from "react";

// One shared "sound on / off" switch for the whole site, remembered between
// visits. Both the background music and the fireworks sound obey it.

const KEY = "diwali-sound-muted";

let muted = (() => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
})();

const listeners = new Set<() => void>();

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* private mode: just keep it in memory */
  }
  listeners.forEach((listener) => listener());
}

export function toggleMuted() {
  setMuted(!muted);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMuted() {
  return useSyncExternalStore(subscribe, isMuted, () => false);
}