import React from "react";
import WalletConnection from "./WalletConnection";
import Authentication from "./Authentication";

const HeaderComponent = () => {
    const [isDarkMode, setIsDarkMode] = React.useState(true);
    const [openModal, setOpenModal] = React.useState(false);

    return (
        <header className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b border-gray-800 shadow-lg">
            <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">

                {/* Brand Section */}
                <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-semibold tracking-tight">DocVerify</h1>
                        <p className="text-sm text-gray-400">
                            Verify Document Authenticity on Solana Blockchain
                        </p>
                    </div>
                </div>

                {/* Wallet + Controls Section */}
                <div className="flex items-center space-x-6">
                    {/* Wallet Button Area */}
                    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg shadow-inner min-w-[230px] justify-center">
                        <WalletConnection />
                    </div>

                    {/* Light/Dark Mode */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="text-sm text-gray-300 hover:text-white transition"
                    >
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </button>

                    {/* Auth Button */}
                    <button
                        onClick={() => setOpenModal(true)}
                        className="text-sm font-medium text-gray-200 hover:text-white hover:underline transition"
                    >
                        Signup / Signin
                    </button>
                </div>
            </div>

            {/* Authentication Modal */}
            {openModal && <Authentication onClose={() => setOpenModal(false)} />}
        </header>
    );
};

export default HeaderComponent;
