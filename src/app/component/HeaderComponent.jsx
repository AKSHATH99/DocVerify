import React, { useEffect } from "react";
import WalletConnection from "./WalletConnection";
import Authentication from "./Authentication";
import { useWallet } from "@solana/wallet-adapter-react";
import { Moon, Sun, ChevronDown } from "lucide-react";
import {
    WalletMultiButton,
    WalletDisconnectButton,
    WalletModalProvider
} from "@solana/wallet-adapter-react-ui";
import { useConnection } from '@solana/wallet-adapter-react';

const HeaderComponent = () => {
    const [isDarkMode, setIsDarkMode] = React.useState(true);
    const [openModal, setOpenModal] = React.useState(false);
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [openAccountMenu, setOpenAccountMenu] = React.useState(false);
    const { connection } = useConnection();
    const { publicKey, sendTransaction, signMessage, connected, connecting, disconnecting } = useWallet();

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
                    {loggedIn ? <p className=" flex gap-5 p-2 rounded-md transition-all duration-300 shadow-sm border border-gray-700 cursor-pointer">
                        <WalletMultiButton className="w-full bg-blue-600 text-white rounded-xl shadow-md px-6 py-3 font-medium hover:bg-blue-700 transition-all" />
                        <ChevronDown className="mt-3" onClick={() => { setOpenAccountMenu(!openAccountMenu) }} />
                    </p> : (
                        <button
                            onClick={() => setOpenModal(true)}
                            className={`text-sm font-medium rounded-lg px-4 py-2 transition-all duration-300 ${isDarkMode
                                ? "bg-blue-600 hover:bg-blue-500 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                        >
                            Sign In / Sign Up
                        </button>
                    )}
                </div>
            </div>

            {/* Authentication Modal */}
            {openModal && <Authentication onClose={() => setOpenModal(false)} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}

            {/* Account Menu */}
            {openAccountMenu && <div className={`absolute top-16 right-6 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-6`}>
                <div className="p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Account Settings</p>
                    <button
                        onClick={() => {
                            localStorage.removeItem("user_id");
                            setLoggedIn(false);
                            setOpenAccountMenu(false);
                            window.dispatchEvent(new Event("logout-success"));
                        }}
                        className="w-full text-left text-sm text-red-600 hover:text-red-800"
                    >
                        Sign Out
                    </button>
                    {connected && <WalletDisconnectButton className="w-full bg-gray-100 text-gray-700 rounded-xl shadow-sm px-6 py-3 font-medium hover:bg-gray-200 transition-all" />
                    }                </div>
            </div>}
        </header>
    );
};

export default HeaderComponent;
