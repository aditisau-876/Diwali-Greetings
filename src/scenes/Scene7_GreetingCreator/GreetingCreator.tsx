
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Bookmark, Trash2, FolderOpen } from "lucide-react";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

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

type SavedGreeting = {
  id: string;
  greeting: GreetingData;
  createdAt?: {
    toMillis: () => number;
  } | null;
};

type GreetingCreatorProps = {
  user: User;
};

export default function GreetingCreator({ user }: GreetingCreatorProps) {
  const [greeting, setGreeting] = useState<GreetingData>(defaultGreeting);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | "save" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedGreeting[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  const exportRef = useRef<HTMLDivElement>(null);
  const cache = useRef<{ key: string; url: string } | null>(null);
  const toastTimer = useRef<number | null>(null);

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
    },
    [],
  );

  // Listen for this user's saved greetings in Firestore.
  useEffect(() => {
    setCardsLoading(true);

    const cardsRef = collection(db, "users", user.uid, "cards");

    const unsubscribe = onSnapshot(
      cardsRef,
      (snapshot) => {
        const cards: SavedGreeting[] = snapshot.docs.map((item) => ({
          id: item.id,
          greeting: item.data().greeting as GreetingData,
          createdAt: item.data().createdAt ?? null,
        }));

        cards.sort(
          (a, b) =>
            (b.createdAt?.toMillis() ?? 0) -
            (a.createdAt?.toMillis() ?? 0),
        );

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
  }, [user.uid, say]);

  // Create a PNG from the dedicated, untransformed card.
  const getPng = async () => {
    const key = JSON.stringify(greeting);

    if (cache.current?.key === key) {
      return cache.current.url;
    }

    const node = exportRef.current?.firstElementChild as HTMLElement | null;

    if (!node) {
      throw new Error("Export card missing");
    }

    const url = await renderCardPng(node);
    cache.current = { key, url };

    return url;
  };

  // Save the greeting data to the signed-in user's Firestore collection.
  const saveCard = async () => {
    setBusy("save");

    try {
      await addDoc(collection(db, "users", user.uid, "cards"), {
        greeting,
        createdAt: serverTimestamp(),
      });

      say("Your greeting card has been saved!");
    } catch (error) {
      console.error("Saving greeting failed:", error);
      say("Could not save your card. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  // Load a saved greeting into the editor.
  const loadCard = (card: SavedGreeting) => {
    setGreeting(card.greeting);
    cache.current = null;
    setShowEnvelope(false);

    window.scrollTo({
      top: document.getElementById("greeting")?.offsetTop ?? 0,
      behavior: "smooth",
    });

    say("Your saved greeting is ready to edit.");
  };

  // Delete a greeting from the current user's collection.
  const removeCard = async (cardId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved greeting?",
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "cards", cardId));
      say("Saved greeting deleted.");
    } catch (error) {
      console.error("Deleting greeting failed:", error);
      say("Could not delete this greeting. Please try again.");
    }
  };

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
        await navigator.share({
          files: [file],
          title: "Happy Diwali",
          text,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "Happy Diwali",
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `${text}\n${window.location.href}`,
        );
        say("Copied to your clipboard.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
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
      </nav>

      <motion.header className="creator-header" {...rise}>
        <h1>Send a light of your own.</h1>
        <p>
          Write a few words, choose a design, and we’ll fold it into a greeting
          you can save or share.
        </p>
      </motion.header>

      <div className="studio">
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
            {busy === "save" ? "Saving..." : "Save this card"}
          </button>
        </motion.aside>
      </div>

      {/* MY SAVED CARDS */}
      <section className="saved-cards-section">
        <div className="saved-cards-heading">
          <div>
            <p className="preview-label">YOUR PERSONAL COLLECTION</p>
            <h2>My Saved Cards</h2>
            <p>Return to the greetings you've created and saved.</p>
          </div>

          <span className="saved-card-count">
            {savedCards.length}{" "}
            {savedCards.length === 1 ? "card" : "cards"}
          </span>
        </div>

        {cardsLoading ? (
          <p className="saved-cards-message">Loading your saved cards...</p>
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
            busy={busy === "download" || busy === "share" ? busy : null}
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
