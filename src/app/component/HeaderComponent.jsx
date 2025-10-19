import React, { useEffect, useRef } from "react";
import Authentication from "./Authentication";
import { useWallet } from "@solana/wallet-adapter-react";
import { Moon, Sun, ChevronDown, Wallet, LogOut, User } from "lucide-react";
import {
    WalletMultiButton,
    WalletDisconnectButton,
    WalletModalProvider
} from "@solana/wallet-adapter-react-ui";
import { useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import ThemeToggle from "./ThemeToggler";

const HeaderComponent = () => {
    const [isDarkMode, setIsDarkMode] = React.useState(true);
    const [openModal, setOpenModal] = React.useState(false);
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [openAccountMenu, setOpenAccountMenu] = React.useState(false);
    const { connection } = useConnection();
    const { publicKey, sendTransaction, signMessage, connected, connecting, disconnecting } = useWallet();
    const [balance, setBalance] = React.useState(null);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (userId) setLoggedIn(true);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDarkMode);
    }, [isDarkMode]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setOpenAccountMenu(false);
            }
        };

        if (openAccountMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openAccountMenu]);

    async function getSolBalance(pubKeyString) {
        const endpoint = clusterApiUrl("devnet");
        const conn = new Connection(endpoint, "confirmed");
        const pubkey = new PublicKey(pubKeyString);
        const lamports = await conn.getBalance(pubkey, "confirmed");
        const sol = lamports / 1_000_000_000;
        return { lamports, sol };
    }

    useEffect(() => {
        if (publicKey) {
            getSolBalance(publicKey).then(balance => {
                console.log("SOL Balance:", balance.sol);
                setBalance(balance.sol);
            }).catch(err => {
                console.error("Error fetching balance:", err);
            });
        }
    }, [publicKey]);

    return (
        <header
            className={`w-full border-b shadow-md transition-all duration-500 
      bg-white border-gray-200 text-gray-900 
      dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
      dark:border-gray-800 dark:text-white`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                {/* Brand Section */}
                <div className="flex items-center space-x-3">
                    <div className="px-3 py-2 rounded-xl backdrop-blur-sm bg-gray-100/60 dark:bg-white/5">
                        <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text dark:from-blue-400 dark:to-purple-500">
                            DocVerify
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Verify Document Authenticity on Solana Blockchain
                        </p>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex items-center space-x-6">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Auth Button */}
                    {loggedIn ? (
                        <div className="relative">
                            <div
                                ref={buttonRef}
                                className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 shadow-sm cursor-pointer 
                bg-gray-50 border border-gray-200 hover:bg-gray-100 
                dark:bg-gray-800/50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                <WalletMultiButton className="wallet-adapter-button-custom" />
                                <button
                                    onClick={() => setOpenAccountMenu(!openAccountMenu)}
                                    className={`p-1 rounded-md transition-all duration-200 ${openAccountMenu ? "rotate-180" : ""} hover:bg-gray-200 dark:hover:bg-gray-700`}
                                >
                                    <ChevronDown size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setOpenModal(true)}
                            className="text-sm font-medium rounded-lg px-4 py-2 transition-all duration-300 
              bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            Sign In / Sign Up
                        </button>
                    )}
                </div>
            </div>

            {/* Authentication Modal */}
            {openModal && (
                <Authentication
                    onClose={() => setOpenModal(false)}
                    loggedIn={loggedIn}
                    setLoggedIn={setLoggedIn}
                />
            )}

            {/* Enhanced Account Menu Dropdown */}
            {openAccountMenu && (
                <div
                    ref={dropdownRef}
                    className="absolute top-20 right-6 w-72 rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 
          bg-white border border-gray-200 
          dark:bg-gray-800 dark:border-gray-700"
                >
                    {/* Header Section */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50" />

                    {/* Balance Section */}
                    <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wallet size={16} className="text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    SOL Balance
                                </span>
                            </div>
                            <div className="px-3 py-1 rounded-full text-sm font-semibold 
              bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 
              dark:from-purple-600/20 dark:to-blue-600/20 dark:text-purple-400">
                                {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}
                            </div>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="px-4 py-3 space-y-2">
                        {connected && (
                            <div className="pb-2 border-b border-gray-700/50">
                                <WalletDisconnectButton
                                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all 
                  bg-gray-100 text-gray-700 hover:bg-gray-200 
                  dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => {
                                localStorage.removeItem("user_id");
                                setLoggedIn(false);
                                setOpenAccountMenu(false);
                                window.dispatchEvent(new Event("logout-success"));
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all 
              text-red-600 hover:bg-red-50 
              dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default HeaderComponent;