import React from "react";
import WalletConnection from "./WalletConnection";

const HeaderComponent = () => {
    return (
        <header className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b border-gray-800 shadow-md">
            <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-start space-x-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-semibold text-white">DocVerify</h1>
                        <p className="mt-1 text-sm text-gray-300">Verify Document Authenticity on Solana Blockchain</p>
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="p-2 rounded-md bg-gray-800 text-white shadow-lg">
                        <WalletConnection />
                    </div>
                </div>
                <div>
                    <p className="text-sm text-gray-300">light mode</p>
                </div>
            </div>
        </header>
    );
}

export default HeaderComponent;