import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";

import { db } from "../firebase/firebase";
import { defaultGreeting } from "../types/greeting";
import type { GreetingData, GreetingTemplate } from "../types/greeting";

export interface SavedGreeting {
  id: string;
  greeting: GreetingData;
  /** Milliseconds since 1970; used only for sorting. */
  createdAt: number;
}

const TEMPLATES: GreetingTemplate[] = [
  "royal",
  "rangoli",
  "midnight",
  "minimal",
  "festival",
  "peacock",
];

/** Cards saved by older versions may miss fields; never trust stored data. */
export function normalizeGreeting(raw: unknown): GreetingData {
  const data = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<GreetingData>;
  return {
    recipient: typeof data.recipient === "string" ? data.recipient : "",
    sender: typeof data.sender === "string" ? data.sender : "",
    message:
      typeof data.message === "string" ? data.message : defaultGreeting.message,
    template: TEMPLATES.includes(data.template as GreetingTemplate)
      ? (data.template as GreetingTemplate)
      : "royal",
    decorations: Array.isArray(data.decorations)
      ? data.decorations
      : defaultGreeting.decorations,
  };
}

/** Two greetings with the same key look identical, so we only save one. */
export function greetingKey(g: GreetingData) {
  return JSON.stringify([g.recipient.trim(), g.sender.trim(), g.message.trim(), g.template]);
}

const cardsPath = (uid: string) => collection(db, "users", uid, "cards");

/**
 * Saves a card. Firestore never rejects while the device is offline - the write
 * just waits in a queue - so we stop waiting after a while and say so, instead
 * of leaving the button on "Saving..." forever.
 */
export async function saveGreeting(
  uid: string,
  greeting: GreetingData,
  waitMs = 12000,
): Promise<"saved" | "queued"> {
  const write = addDoc(cardsPath(uid), {
    greeting,
    createdAt: serverTimestamp(),
  });

  let timer = 0;
  const timeout = new Promise<"queued">((resolve) => {
    timer = window.setTimeout(() => resolve("queued"), waitMs);
  });

  try {
    return await Promise.race([write.then(() => "saved" as const), timeout]);
  } finally {
    window.clearTimeout(timer);
    // If we gave up waiting, still swallow a late failure so it isn't unhandled.
    write.catch(() => undefined);
  }
}

export function subscribeToGreetings(
  uid: string,
  onData: (cards: SavedGreeting[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    cardsPath(uid),
    (snapshot) => {
      const cards = snapshot.docs.map((item) => {
        // "estimate" gives a just-saved card a time right away, so it sorts first.
        const data = item.data({ serverTimestamps: "estimate" });
        const created = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: item.id,
          greeting: normalizeGreeting(data.greeting),
          createdAt: created?.toMillis?.() ?? Date.now(),
        };
      });
      cards.sort((a, b) => b.createdAt - a.createdAt);
      onData(cards);
    },
    onError,
  );
}

export function deleteGreeting(uid: string, cardId: string) {
  return deleteDoc(doc(db, "users", uid, "cards", cardId));
}