import React, { useEffect } from "react";
import WalletConnection from "./WalletConnection";
import Authentication from "./Authentication";
import { useWallet } from "@solana/wallet-adapter-react";
import { Moon, Sun } from "lucide-react";

const HeaderComponent = () => {
    const [isDarkMode, setIsDarkMode] = React.useState(true);
    const [openModal, setOpenModal] = React.useState(false);
    const { publicKey } = useWallet();
    const [loggedIn, setLoggedIn] = React.useState(false);

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (userId) setLoggedIn(true);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDarkMode);
    }, [isDarkMode]);

    return (
        <header
            className={`w-full border-b shadow-md transition-all duration-500 ${isDarkMode
                    ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-gray-800 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                {/* Brand Section */}
                <div className="flex items-center space-x-3">
                    <div
                        className={`px-3 py-2 rounded-xl backdrop-blur-sm ${isDarkMode ? "bg-white/5" : "bg-gray-100/60"
                            }`}
                    >
                        <h1
                            className={`text-2xl font-semibold tracking-tight ${isDarkMode
                                    ? "bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
                                    : "bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text"
                                }`}
                        >
                            DocVerify
                        </h1>
                        <p
                            className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Verify Document Authenticity on Solana Blockchain
                        </p>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex items-center space-x-6">
                    {/* Wallet Button */}
                    <div
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-inner min-w-[230px] justify-center transition-all duration-300 ${isDarkMode
                                ? "bg-gray-800 hover:bg-gray-700"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                    >
                        <WalletConnection />
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`p-2 rounded-full transition-all duration-300 ${isDarkMode
                                ? "hover:bg-gray-800 text-gray-300 hover:text-white"
                                : "hover:bg-gray-100 text-gray-600 hover:text-black"
                            }`}
                        aria-label="Toggle Theme"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {/* Auth Button */}
                    <button
                        onClick={() => setOpenModal(true)}
                        className={`text-sm font-medium rounded-lg px-4 py-2 transition-all duration-300 ${isDarkMode
                                ? "bg-blue-600 hover:bg-blue-500 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                    >
                        {loggedIn ? (
                            <p>
                                {publicKey &&
                                    `${publicKey.toString().slice(0, 4)}...${publicKey
                                        .toString()
                                        .slice(-4)}`}
                            </p>
                        ) : (
                            "Sign In / Sign Up"
                        )}
                    </button>
                </div>
            </div>

            {/* Authentication Modal */}
            {openModal && <Authentication onClose={() => setOpenModal(false)} />}
        </header>
    );
};

export default HeaderComponent;
