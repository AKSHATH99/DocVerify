import React from "react";
import CryptoJS from 'crypto-js';
import { Connection, PublicKey, Transaction, SystemProgram, clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import bs58 from "bs58";


export default function VerifyHash({setActiveModal}) {

    const [hash, setHash] = React.useState('');
    const { publicKey, connected } = useWallet();

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const wordArray = CryptoJS.lib.WordArray.create(reader.result);
            const sha256Hash = CryptoJS.SHA256(wordArray).toString();
            setHash(sha256Hash);
        };
        reader.readAsArrayBuffer(file);
    };

    async function verifyHashOnChain(hash, walletAddress) {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const pubKey = new PublicKey(walletAddress);
        console.log("verifying hash:", hash);
        console.log("public key:", pubKey.toString());

        const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 20 });

        for (let sigInfo of signatures) {
            const tx = await connection.getTransaction(sigInfo.signature, {
                maxSupportedTransactionVersion: 0,
            });

            console.log("Transaction:", tx.transaction.signatures[0]);
            if (!tx) continue;

            for (let ix of tx.transaction.message.instructions) {
                const programId = tx.transaction.message.accountKeys[ix.programIdIndex].toString();
                console.log("Program ID:", programId);
                console.log("MEMO PROGRAM_ID:", MEMO_PROGRAM_ID.toString());
                console.log("Instruction:", ix);
                console.log("Instruction Data (base64):", ix.data);
                console.log("try  out",)


                if (programId === MEMO_PROGRAM_ID.toString()) {
                    const memoBytes = bs58.decode(ix.data);
                    const memoData = new TextDecoder("utf-8").decode(memoBytes);

                    console.log("📝 Memo data:", memoData);

                    if (memoData === hash) {
                        console.log("✅ Hash found on-chain:", sigInfo.signature);
                        return true;
                    }
                }
            }
        }

        console.log("❌ Hash not found on-chain.");
        return false;
    }


    return (
        <div className="w-full flex flex-col items-start justify-center mt-16 px-8">
            {/* Heading */}
            <h2 className="text-xl font-semibold text-white mb-2">
                Verify File Hash
            </h2>

            {/* Subtext */}
            <p className="text-gray-400 mb-4">
                Upload a file to compute its SHA256 hash and verify its authenticity on Solana
            </p>

            {/* File input */}
            <div className="w-full max-w-2xl mb-6">
                <input
                    type="file"
                    onChange={(e) => { handleFileUpload(e); setActiveModal("verify"); }}
                    className="w-full px-4 py-2 bg-[#1E1E1E] text-gray-200 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                />
            </div>
            {hash && (
                <div className="w-full max-w-2xl mb-4 bg-gray-800 border border-gray-700 rounded-md p-3 break-all">
                    <p className="text-gray-400 text-sm mb-1">SHA256 Hash:</p>
                    <p className="text-gray-100 font-mono text-sm">{hash}</p>
                </div>
            )}

            {/* Verify button */}
            <button
                onClick={() => verifyHashOnChain(hash, publicKey?.toString())}
                disabled={!hash}
                className={`w-full max-w-2xl py-3 rounded-md font-medium text-center transition
      ${hash
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
            >
                Verify Hash on Solana
            </button>
        </div>

    );
}