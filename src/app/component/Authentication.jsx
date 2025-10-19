import { useEffect, useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';

import {
    WalletMultiButton,
    WalletDisconnectButton,
    WalletModalProvider
} from "@solana/wallet-adapter-react-ui";
export default function Authentication({ onClose, loggedIn, setLoggedIn }) {
    const [authMethod, setAuthMethod] = useState("");
    const [formData, setFormData] = useState({ email: "", name: "", walletAddress: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { publicKey, connected, connect, disconnect } = useWallet();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSignup = async () => {
        console.log(formData, "signup form data");

        const signupRes = await fetch("http://localhost:3000/api/user/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                wallet_address: publicKey.toString(),
                email: formData.email,
                name: formData.name,
            }),
        });

        const data = await signupRes.json();

        if (!signupRes.ok) throw new Error(data.error || "Signup failed");

        setSuccess("Account created successfully!");
        console.log("User signed up:", data.user);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('wallet_address', data.user.wallet_address);
        setAuthMethod("");
        setLoggedIn(true);
        window.dispatchEvent(new Event("login-success"));

    };

    const handleWalletAuth = async () => {
        if (!connected || !publicKey) {
            setError("Please connect your wallet first");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const walletAddress = publicKey.toString();

            // 1️⃣ Try login
            const loginRes = await fetch("http://localhost:3000/api/user/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet_address: walletAddress }),
            });

            if (loginRes.ok) {
                const data = await loginRes.json();
                setSuccess("Login successful!");
                console.log("User logged in:", data.user);
                localStorage.setItem('user_id', data.user.id);
                localStorage.setItem('wallet_address', data.user.wallet_address);
                setLoggedIn(true);
                window.dispatchEvent(new Event("login-success"));
                return;
            }

            // 2️⃣ If login fails, show signup form
            if (loginRes.status === 404) {
                setAuthMethod("signup");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!connected) {
            setFormData({
                email: "",
                name: "",
                walletAddress: publicKey ? publicKey.toString() : "",
            });
        }
    }, [connected, publicKey]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 text-black dark:text-white">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                        Authentication
                    </h1>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-lg transition"
                    >
                        ✕
                    </button>
                </div>

                <div className="text-center">
                    {connected ? (
                        authMethod === "signup" ? (
                            // ✅ Show Signup Form
                            <div className="mt-4 space-y-4 text-left">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                                    Complete Signup
                                </h2>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                    type="text"
                                    name="walletAddress"
                                    value={publicKey.toString()}
                                    disabled
                                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md px-3 py-2 cursor-not-allowed"
                                />
                                <button
                                    onClick={handleSignup}
                                    disabled={loading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md transition"
                                >
                                    {loading ? "Processing..." : "Sign Up"}
                                </button>
                            </div>
                        ) : (
                            // ✅ Show Authenticate with Wallet Button
                            <div>
                                <p className="text-green-600 dark:text-green-400 mb-4">
                                    Wallet connected:
                                    <span className="block font-mono text-sm break-all mt-1 text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md p-2 border border-gray-300 dark:border-gray-700">
                                        {publicKey.toString()}
                                    </span>
                                </p>
                                <button
                                    onClick={handleWalletAuth}
                                    disabled={loading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md transition"
                                >
                                    {loading ? "Processing..." : "Authenticate with Wallet"}
                                </button>
                            </div>
                        )
                    ) : (
                        <WalletMultiButton/>
                       
                    )}

                    {/* ✅ Status Messages */}
                    {success && <p className="text-green-600 dark:text-green-400 mt-3 text-sm">{success}</p>}
                    {error && <p className="text-red-600 dark:text-red-400 mt-3 text-sm">{error}</p>}
                </div>
            </div>
        </div>

    );
}
