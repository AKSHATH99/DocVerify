import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { ed25519 } from "@noble/curves/ed25519.js";
import {
    WalletMultiButton,
    WalletDisconnectButton,
    WalletModalProvider
} from "@solana/wallet-adapter-react-ui";

export default function WalletConnection({ children }) {

    const { connection } = useConnection();
    const { publicKey, sendTransaction, signMessage, connected, connecting, disconnecting } = useWallet();


    return (
        <div className="">
            

            <div className=" flex flex-row gap-10 items-center justify-center">
                <WalletMultiButton className="w-full bg-blue-600 text-white rounded-xl shadow-md px-6 py-3 font-medium hover:bg-blue-700 transition-all" />
                {connected && (
                    <WalletDisconnectButton className="w-full bg-gray-100 text-gray-700 rounded-xl shadow-sm px-6 py-3 font-medium hover:bg-gray-200 transition-all" />
                )}
            </div>
        </div>
    );
}