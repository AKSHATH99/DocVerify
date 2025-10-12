import React from "react";
import CryptoJS from 'crypto-js';
import { Connection, PublicKey, Transaction, SystemProgram, clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import bs58 from "bs58";


export default function VerifyHash() {

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
        <div className="flex flex-col items-center p-6 border border-gray-800 m-28 bg-black text-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">Verify File Hash</h2>
            <p className="mb-2 text-gray-300">
                Upload a file to compute its SHA256 hash:
            </p>
            <input
                type="file"
                onChange={handleFileUpload}
                className="mb-4 bg-gray-900 text-gray-200 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-white"
            />
            {hash && (
                <p className="text-gray-100 bg-gray-800 rounded px-2 py-1 mt-2 break-all">
                    SHA256: <span className="font-mono">{hash}</span>
                </p>
            )}
            <button
                onClick={() => verifyHashOnChain(hash, publicKey.toString())}
                disabled={!hash}
                className="mt-4 px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 transition"
            >
                Verify Hash on Solana
            </button>
        </div>
    );
}