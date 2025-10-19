import React, { useState } from "react";
import CryptoJS from 'crypto-js';
import { Connection, PublicKey, Transaction, SystemProgram, clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import bs58 from "bs58";
import LoaderAnimation from "./LoaderAnimation";
import { FileText, Trash, CircleCheckBig, Shield, Calendar, User, Hash, ExternalLink, Info } from 'lucide-react';

export default function VerifyHash({ setActiveModal }) {

    const [hash, setHash] = useState('');
    const { publicKey, connected } = useWallet();
    const [verified, setVerified] = useState(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [loadingFile, setLoadingFile] = useState(false);
    const [infoTooltip, setInfoTooltip] = useState("");

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            // reader.result is an ArrayBuffer; convert to Uint8Array for CryptoJS
            const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(reader.result));
            const sha256Hash = CryptoJS.SHA256(wordArray).toString();
            setHash(sha256Hash);
        };
        reader.readAsArrayBuffer(file);
    };

    async function verifyHashOnChain(hash, walletAddress) {
        setLoading(true);
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const pubKey = new PublicKey(walletAddress);
        console.log("verifying hash:", hash);
        console.log("public key:", pubKey.toString());

        const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 20 });

        for (let sigInfo of signatures) {
            const tx = await connection.getTransaction(sigInfo.signature, {
                maxSupportedTransactionVersion: 0,
            });

            if (!tx) continue;
            console.log("Transaction:", tx.transaction.signatures[0]);

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
                        // fetch file metadata from backend and then mark verified
                        await fetchFile(hash);
                        setVerified(true);
                        setLoading(false);
                        return true;
                    }
                }
            }

        }

        console.log("❌ Hash not found on-chain.");
        setVerified(false);
        setLoading(false);
        return false;
    }

    const fetchFile = async (hash) => {
        setLoadingFile(true);
        setError("");

        try {
            const response = await fetch(`/api/file/fetchfile?hash=${hash}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to fetch files");

            // backend might return files as an array or a single object
            setFile(data.files || data.file || []);
            console.log("Fetched file data:", data);
        } catch (err) {
            console.error("Error fetching files:", err);
            setError(err.message);
        } finally {
            setLoadingFile(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-start justify-center mt-16 px-8">
            {/* Heading */}
            <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-blue-400 dark:text-blue-400" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Verify File Hash
                </h2>
            </div>

            {/* Subtext */}
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm leading-relaxed flex gap-2">
                Verify that your file is authentic and unaltered by checking its hash on the Solana blockchain.
                <Info className="w-5 hover:cursor-pointer" onClick={() => { setInfoTooltip(!infoTooltip) }} />
            </p>

            {/* File input */}
            <div className="w-full max-w-2xl mb-6">
                <input
                    type="file"
                    onChange={(e) => { handleFileUpload(e); setActiveModal("verify"); }}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-200 dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-300 file:cursor-pointer hover:file:bg-gray-300 dark:hover:file:bg-gray-700"
                />
            </div>
            {hash && (
                <div className="w-full max-w-2xl mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">SHA256 Hash:</p>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 font-mono text-xs leading-relaxed break-all bg-white/50 dark:bg-black/30 p-3 rounded border border-gray-300 dark:border-gray-800">{hash}</p>
                </div>
            )}

            {/* Verify button */}
            {loading ? <LoaderAnimation /> : <button
                onClick={() => verifyHashOnChain(hash, publicKey?.toString())}
                disabled={!hash}
                className={`w-full max-w-2xl py-3 rounded-lg font-semibold text-center transition-all duration-200 shadow-lg
      ${hash
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white dark:text-white transform hover:scale-[1.01]"
                        : "bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                    }`}
            >
                Verify Hash on Solana
            </button>}

            {verified === true && (
                <div className="border border-green-500/30 dark:border-green-500/30 bg-gradient-to-br from-green-100/60 to-gray-100/60 dark:from-green-950/40 dark:to-gray-900/40 backdrop-blur-sm rounded-xl p-6 mt-8 w-full max-w-2xl shadow-xl">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-green-500/10 dark:bg-green-500/10 rounded-lg">
                            <CircleCheckBig className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-green-700 dark:text-green-400 font-semibold text-lg mb-1">Verification Successful</h3>
                            <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed">The file's SHA-256 hash matches the record stored on Solana, confirming it hasn't been modified since upload.</p>
                        </div>
                    </div>

                    {/* display file details directly (fields come from DB) */}
                    {file && (
                        <div className="mt-4 bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-black border border-gray-300 dark:border-gray-800 rounded-lg p-5 shadow-inner">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/10 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{file?.[0]?.file_name}</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center gap-2 text-xs">
                                            <User className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                                            <span className="text-gray-600 dark:text-gray-500 font-medium">Uploaded by:</span>
                                            <span className="text-gray-800 dark:text-gray-300 font-mono bg-gray-200/50 dark:bg-gray-800/50 px-2 py-1 rounded">{file?.[0]?.wallet_address}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                                            <span className="text-gray-600 dark:text-gray-500 font-medium">Timestamp:</span>
                                            <span className="text-gray-800 dark:text-gray-300">{new Date(file?.[0]?.created_at).toLocaleString()}</span>
                                        </div>

                                        <div className="flex items-start gap-2 text-xs">
                                            <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-500 mt-0.5" />
                                            <span className="text-gray-600 dark:text-gray-500 font-medium">Transaction:</span>
                                            <span className="text-gray-800 dark:text-gray-300 font-mono break-all bg-gray-200/50 dark:bg-gray-800/50 px-2 py-1 rounded flex-1">{file?.[0]?.transaction_signature}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {verified === false && (
                <div className="mt-6 w-full max-w-2xl bg-gradient-to-br from-red-100/60 to-gray-100/60 dark:from-red-950/40 dark:to-gray-900/40 border border-red-500/30 dark:border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                    <div className="text-red-600 dark:text-red-400 text-xl">❌</div>
                    <p className="text-red-700 dark:text-red-400 font-medium">Hash not found on-chain. This file may not be registered or has been altered.</p>
                </div>
            )}
            {infoTooltip && (
                <div className="absolute top-7   right-20 w-80 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-gray-900 dark:text-white font-semibold">What is Hash Verification?</h4>
                        <button onClick={() => setInfoTooltip("")} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        Hash verification allows you to confirm the authenticity and integrity of a file by comparing its SHA-256 hash against a record stored on the Solana blockchain. If the hashes match, it ensures that the file has not been altered or tampered with since it was originally uploaded.
                    </p>
                </div>
            )}
        </div>

    );
}