import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bookmark,
  Trash2,
  FolderOpen,
  LogIn,
  LogOut,
} from "lucide-react";

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { auth, googleProvider } from "../../firebase/firebase";
import {
  deleteGreeting,
  greetingKey,
  saveGreeting,
  subscribeToGreetings,
} from "../../services/greetingService";
import type { SavedGreeting } from "../../services/greetingService";

import EnvelopeReveal from "./EnvelopeReveal";
import GreetingCard from "./GreetingCard";
import GreetingEditor from "./GreetingEditor";
import GreetingPreview from "./GreetingPreview";
import TemplateSelector from "./TemplateSelector";
import { fileNameFor, renderCardPng } from "./exportCard";

import { defaultGreeting } from "../../types/greeting";
import type { GreetingData } from "../../types/greeting";

import "./cards.css";
import "./studio.css";

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
}

function errorName(error: unknown) {
  return error instanceof Error ? error.name : "";
}

export default function GreetingCreator() {
  const [greeting, setGreeting] = useState<GreetingData>(defaultGreeting);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [showEnvelope, setShowEnvelope] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | "save" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [savedCards, setSavedCards] = useState<SavedGreeting[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  const studioRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);

  // One render of the PNG is shared by Download and Share.
  const cache = useRef<{ key: string; promise: Promise<string> } | null>(null);

  // A save that is waiting for the visitor to finish signing in.
  const pendingSave = useRef<GreetingData | null>(null);
  const pendingTimers = useRef<number[]>([]);
  const savedKeys = useRef<Set<string>>(new Set());
  const sawFirstAuth = useRef(false);

  const updateGreeting = (updated: Partial<GreetingData>) => {
    setGreeting((prev) => ({ ...prev, ...updated }));
  };

  const say = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      pendingTimers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  /* ------------------------------------------------------------------
     Saving
  ------------------------------------------------------------------ */

  const persist = useCallback(
    async (uid: string, data: GreetingData) => {
      if (savedKeys.current.has(greetingKey(data))) {
        say("This card is already in your collection.");
        setBusy(null);
        return;
      }

      setBusy("save");
      try {
        const result = await saveGreeting(uid, data);
        say(
          result === "saved"
            ? "Your greeting card has been saved."
            : "You seem to be offline. Your card will be saved when you reconnect.",
        );
      } catch (error) {
        console.error("Saving greeting failed:", error);
        say(
          errorCode(error) === "permission-denied"
            ? "Saving isn't allowed yet. Please check your Firestore rules."
            : "Could not save your card. Please try again.",
        );
      } finally {
        setBusy(null);
      }
    },
    [say],
  );

  const clearPending = useCallback(() => {
    pendingSave.current = null;
    pendingTimers.current.forEach((t) => window.clearTimeout(t));
    pendingTimers.current = [];
  }, []);

  // Firebase tells us when sign-in really finishes. We finish a waiting save
  // from here, rather than from the sign-in pop-up's promise, which can stay
  // unresolved in some browsers even though the visitor is signed in.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      const isFirst = !sawFirstAuth.current;
      sawFirstAuth.current = true;

      if (!currentUser) return;

      const waiting = pendingSave.current;
      if (waiting) {
        clearPending();
        void persist(currentUser.uid, waiting);
      } else if (!isFirst) {
        say("Signed in. You can now save your greetings.");
      }
    });
    return unsubscribe;
  }, [persist, clearPending, say]);

  // Load saved cards only while someone is signed in.
  useEffect(() => {
    if (!user) {
      setSavedCards([]);
      savedKeys.current = new Set();
      setCardsLoading(false);
      return;
    }

    setCardsLoading(true);
    const unsubscribe = subscribeToGreetings(
      user.uid,
      (cards) => {
        savedKeys.current = new Set(cards.map((c) => greetingKey(c.greeting)));
        setSavedCards(cards);
        setCardsLoading(false);
      },
      (error) => {
        console.error("Unable to load saved cards:", error);
        setCardsLoading(false);
        say("Unable to load your saved cards. Please try again.");
      },
    );
    return unsubscribe;
  }, [user, say]);

  const explainSignInError = useCallback(
    (error: unknown) => {
      const code = errorCode(error);
      if (code === "auth/cancelled-popup-request") return; // a second click; ignore
      if (code === "auth/popup-closed-by-user") say("Sign-in was cancelled.");
      else if (code === "auth/popup-blocked")
        say("Your browser blocked the sign-in pop-up. Please allow pop-ups and try again.");
      else if (code === "auth/unauthorized-domain")
        say("This website's address isn't authorised for sign-in yet.");
      else if (code === "auth/network-request-failed")
        say("No connection. Please check your internet and try again.");
      else say("Unable to complete sign-in. Please try again.");
    },
    [say],
  );

  // Sign in or sign out from the account button.
  const handleAccountAction = async () => {
    try {
      if (user) {
        await signOut(auth);
        say("You have been signed out.");
      } else {
        // The "Signed in" message comes from the auth listener above.
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error("Account action failed:", error);
      explainSignInError(error);
    }
  };

  // Save the current greeting. Asks for Google sign-in first if necessary.
  const saveCard = async () => {
    if (busy) return;

    const current = auth.currentUser;
    if (current) {
      await persist(current.uid, greeting);
      return;
    }

    // Remember what to save, then sign in. The auth listener finishes the job.
    clearPending();
    pendingSave.current = greeting;
    setBusy("save");
    say("Sign in with Google to save your greeting.");

    // Safety net 1: the pop-up was closed without signing in.
    const onFocus = () => {
      pendingTimers.current.push(
        window.setTimeout(() => {
          if (pendingSave.current && !auth.currentUser) {
            clearPending();
            setBusy(null);
            say("Sign-in didn't finish. Your greeting is still here.");
          }
        }, 4000),
      );
    };
    window.addEventListener("focus", onFocus, { once: true });

    // Safety net 2: never stay on "Saving..." for more than two minutes.
    pendingTimers.current.push(
      window.setTimeout(() => {
        if (pendingSave.current) {
          clearPending();
          setBusy(null);
        }
      }, 120000),
    );

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign-in for saving failed:", error);
      window.removeEventListener("focus", onFocus);
      clearPending();
      setBusy(null);
      explainSignInError(error);
    }
  };

  // Load a saved greeting into the editor.
  const loadCard = (card: SavedGreeting) => {
    setGreeting(card.greeting);
    cache.current = null;
    setShowEnvelope(false);

    studioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    say("Your saved greeting is ready to edit.");
  };

  // Delete a greeting from the current user's collection.
  const removeCard = async (cardId: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this saved greeting?",
    );
    if (!confirmed) return;

    try {
      await deleteGreeting(user.uid, cardId);
      say("Saved greeting deleted.");
    } catch (error) {
      console.error("Deleting greeting failed:", error);
      say("Could not delete this greeting. Please try again.");
    }
  };

  /* ------------------------------------------------------------------
     Download + share
  ------------------------------------------------------------------ */

  // Create a PNG from the dedicated, untransformed card.
  const getPng = useCallback(() => {
    const key = JSON.stringify(greeting);
    if (cache.current?.key === key) return cache.current.promise;

    const node = exportRef.current?.firstElementChild as HTMLElement | null;
    if (!node) return Promise.reject(new Error("Export card missing"));

    const promise = renderCardPng(node);
    cache.current = { key, promise };
    promise.catch(() => {
      if (cache.current?.promise === promise) cache.current = null;
    });
    return promise;
  }, [greeting]);

  // Prepare the image shortly after the envelope opens, so Download and Share
  // react instantly. (Browsers only allow sharing right after a tap.)
  useEffect(() => {
    if (!showEnvelope) return;
    const t = window.setTimeout(() => {
      getPng().catch(() => undefined);
    }, 2200);
    return () => window.clearTimeout(t);
  }, [showEnvelope, getPng]);

  const download = async () => {
    setBusy("download");
    try {
      const url = await getPng();
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameFor(greeting.recipient);
      document.body.appendChild(a);
      a.click();
      a.remove();
      say("Image saved.");
    } catch (error) {
      console.error("Greeting download failed:", error);
      say("Couldn’t create the image. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    const text = `A Diwali greeting for you: ${greeting.message}`;

    try {
      let file: File | null = null;
      try {
        const blob = await (await fetch(await getPng())).blob();
        file = new File([blob], fileNameFor(greeting.recipient), {
          type: "image/png",
        });
      } catch {
        file = null;
      }

      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Happy Diwali", text });
      } else if (navigator.share) {
        await navigator.share({
          title: "Happy Diwali",
          text,
          url: window.location.href,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        say("Copied to your clipboard.");
      } else {
        say("Sharing isn’t available here. Try downloading instead.");
      }
    } catch (error) {
      const name = errorName(error);
      if (name === "AbortError") return; // the visitor closed the share sheet
      if (name === "NotAllowedError") {
        // The browser wants a fresh tap; the image is now ready, so the next one is instant.
        say("Your image is ready. Tap Share once more.");
      } else {
        console.error("Sharing failed:", error);
        say("Sharing isn’t available here. Try downloading instead.");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="creator-page">
      <nav className="creator-nav">
        <span className="creator-logo">A Light Within</span>

        <div className="creator-nav-actions">
          <button
            className="back-button"
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            <ArrowUp size={15} />
            Back to the story
          </button>

          {!authLoading && (
            <button
              className="back-button account-button"
              type="button"
              onClick={handleAccountAction}
            >
              {user ? <LogOut size={15} /> : <LogIn size={15} />}
              {user ? "Sign out" : "Sign in to save cards"}
            </button>
          )}
        </div>
      </nav>

      <motion.header className="creator-header" {...rise}>
        <h1>Send a light of your own.</h1>

        <p>
          Write a few words, choose a design, and we’ll fold it into a greeting
          you can save or share.
        </p>
      </motion.header>

      <div className="studio" ref={studioRef}>
        <div className="studio-controls">
          <motion.section {...rise}>
            <GreetingEditor
              greeting={greeting}
              onChange={updateGreeting}
            />
          </motion.section>

          <motion.section {...rise}>
            <TemplateSelector
              selected={greeting.template}
              onSelect={(template) => updateGreeting({ template })}
            />
          </motion.section>
        </div>

        <motion.aside className="studio-preview" {...rise}>
          <p className="preview-label">Preview</p>

          <GreetingPreview greeting={greeting} />

          <button
            className="btn btn-primary preview-cta"
            type="button"
            onClick={() => setShowEnvelope(true)}
          >
            Seal and open your greeting
          </button>

          <button
            className="btn btn-quiet save-card-button"
            type="button"
            onClick={saveCard}
            disabled={busy !== null}
          >
            <Bookmark size={17} />
            {busy === "save"
              ? "Saving..."
              : user
                ? "Save this card"
                : "Sign in to save this card"}
          </button>
        </motion.aside>
      </div>

      {/* MY SAVED CARDS */}
      <section className="saved-cards-section">
        <div className="saved-cards-heading">
          <div>
            <p className="preview-label">YOUR PERSONAL COLLECTION</p>
            <h2>My Saved Cards</h2>

            <p>
              Return to the greetings you've created and saved.
            </p>
          </div>

          {user && (
            <span className="saved-card-count">
              {savedCards.length}{" "}
              {savedCards.length === 1 ? "card" : "cards"}
            </span>
          )}
        </div>

        {authLoading ? (
          <p className="saved-cards-message">
            Checking your account...
          </p>
        ) : !user ? (
          <div className="saved-cards-empty">
            <FolderOpen size={32} />

            <h3>Your collection is waiting.</h3>

            <p>
              You can create and download greetings without signing in.
              Sign in with Google whenever you want to save your cards here.
            </p>

            <button
              className="btn btn-primary"
              type="button"
              onClick={handleAccountAction}
            >
              <LogIn size={16} />
              Sign in with Google
            </button>
          </div>
        ) : cardsLoading ? (
          <p className="saved-cards-message">
            Loading your saved cards...
          </p>
        ) : savedCards.length === 0 ? (
          <div className="saved-cards-empty">
            <FolderOpen size={32} />

            <h3>Your collection is waiting.</h3>

            <p>
              Create a Diwali greeting and select Save this card to keep it
              here.
            </p>
          </div>
        ) : (
          <div className="saved-cards-grid">
            {savedCards.map((card) => (
              <article className="saved-card-item" key={card.id}>
                <div className="saved-card-art">
                  <GreetingCard greeting={card.greeting} />
                </div>

                <div className="saved-card-details">
                  <h3>
                    {card.greeting.recipient || "Diwali Greeting"}
                  </h3>

                  <p>{card.greeting.message}</p>

                  <div className="saved-card-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => loadCard(card)}
                    >
                      Open card
                    </button>

                    <button
                      className="saved-card-delete"
                      type="button"
                      onClick={() => removeCard(card.id)}
                      aria-label="Delete saved card"
                      title="Delete card"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {showEnvelope && (
          <EnvelopeReveal
            greeting={greeting}
            busy={
              busy === "download" || busy === "share"
                ? busy
                : null
            }
            onClose={() => setShowEnvelope(false)}
            onDownload={download}
            onShare={share}
          />
        )}
      </AnimatePresence>

      {/* Off-screen, fixed-size copy used only for the PNG export */}
      <div className="export-stage" aria-hidden="true" ref={exportRef}>
        <GreetingCard greeting={greeting} />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="creator-footer">
        Made with light, love and a little Diwali magic.
      </footer>
    </main>
  );
}