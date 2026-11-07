
import { useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    type User,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase/firebase";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import "./AuthGate.css";

type AuthGateProps = {
    children: (user: User) => React.ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleGoogleSignIn = async () => {
        setError("");

        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Google sign-in failed:", error);

            if (error instanceof Error) {
                setError(`${error.message} (${(error as { code?: string }).code || "unknown"})`);
            } else {
                setError("Sign-in failed. Please try again.");
            }
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign-out failed:", error);
            setError("Unable to sign out. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="auth-loading">
                <div className="auth-spinner" />
                <p>Preparing your Diwali experience...</p>
            </div>
        );
    }

    if (user) {
        return (
            <>
                <div className="auth-user-bar">
                    <div className="auth-user-info">
                        {user.photoURL && (
                            <img src={user.photoURL} alt="" />
                        )}
                        <span>{user.displayName || user.email}</span>
                    </div>

                    <button
                        type="button"
                        className="auth-signout"
                        onClick={handleSignOut}
                    >
                        <LogOut size={15} />
                        Sign out
                    </button>
                </div>

                {children(user)}
            </>
        );
    }

    return (
        <section className="auth-page">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                <div className="auth-diya">🪔</div>

                <p className="auth-eyebrow">A LIGHT WITHIN</p>

                <h1>Your light, your story.</h1>

                <p className="auth-description">
                    Sign in to create personalized Diwali greetings
                    and save your favourite cards for later.
                </p>

                <button
                    type="button"
                    className="google-signin-button"
                    onClick={handleGoogleSignIn}
                >
                    <svg viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.72 5.99c4.51-4.16 7.06-10.28 7.06-17.64Z" />
                        <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19Z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.72-5.99c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                    </svg>
                    Continue with Google
                </button>

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}

                <p className="auth-privacy">
                    Your saved greetings belong to your account.
                </p>
            </motion.div>
        </section>
    );
}
