'use client';
import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import bs58 from 'bs58';
import LoaderAnimation from './LoaderAnimation';
import { Trash } from 'lucide-react';

export default function UploadFile({ onFileHashComputed }) {

    const [hash, setHash] = useState('');
    const wallet = useWallet();
    const { connection } = useConnection();
    const [note, setNote] = useState('');
    const [fileSize, setFileSize] = useState(0);
    const [fileType, setFileType] = useState("");
    const [filename, setFileName] = useState("");
    const [showLink, setShowLink] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileSize(file.size); // in bytes
        setFileType(file.type || "Unknown");
        setFileName(file.name || "Unknown");

        const reader = new FileReader();
        reader.onload = () => {
            const wordArray = CryptoJS.lib.WordArray.create(reader.result);
            const sha256Hash = CryptoJS.SHA256(wordArray).toString();
            setHash(sha256Hash);
        };
        reader.readAsArrayBuffer(file);
    };

    async function uploadFileDetails({
        user_id,
        file_name,
        file_hash,
        transaction_signature = null,
        file_type,
        file_size,
        note = "",
        wallet_address
    }) {
        try {
            const response = await fetch("/api/file/uploadfile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id,
                    file_name,
                    file_hash,
                    transaction_signature,
                    file_type,
                    file_size,
                    note,
                    wallet_address
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to upload file details");
            }

            return data;
        } catch (err) {
            console.error("Upload API error:", err.message);
            return { success: false, error: err.message };
        }
    }

    async function storeHashOnChain(hash) {
        console.log("hash storing:", hash);
        setUploading(true);

        // 1️⃣ Create transaction
        const transaction = new Transaction().add({
            keys: [],
            programId: MEMO_PROGRAM_ID,
            data: Buffer.from(hash, "utf8"),
        });

        // 2️⃣ Send transaction
        const sig = await wallet.sendTransaction(transaction, connection);
        console.log("⏳ Waiting for confirmation...");
        await connection.confirmTransaction(sig, "confirmed");
        console.log("✅ Stored on-chain! Signature:", sig);

        // 3️⃣ Fetch the transaction
        const tx = await connection.getTransaction(sig, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
            console.log("⚠️ Transaction not found (maybe not confirmed yet)");
            return;
        }

        console.log("🔍 Full Transaction:", tx);

        // 4️⃣ Decode the memo data correctly
        for (let ix of tx.transaction.message.instructions) {
            const programId = tx.transaction.message.accountKeys[ix.programIdIndex].toString();
            if (programId === MEMO_PROGRAM_ID.toString()) {
                const memoBytes = bs58.decode(ix.data);
                const memoData = new TextDecoder("utf-8").decode(memoBytes);
                console.log("📝 Memo stored on-chain:", memoData);

                //Adding to database
                const userid = localStorage.getItem('user_id');
                const res = await uploadFileDetails({
                    user_id: userid,
                    file_name: filename,
                    file_hash: memoData,
                    transaction_signature: sig,
                    file_type: fileType,
                    file_size: fileSize,
                    note: note,
                    wallet_address: wallet.publicKey.toString()
                });
                // show verification link
                setShowLink(true);
                setUploading(false);
            }
        }
    }
    return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8 max-w-md mx-auto mt-10">
            <p className="text-lg font-semibold text-gray-900 mb-6">
                Upload a file to compute its SHA256 hash:
            </p>
            <div className='flex'>            
                <input
                type="file"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black mb-6"
            />
                {hash && <button onClick={() => { setHash(''); setShowLink(false); setNote(''); }} className='ml-2 -mt-5 text-red-600 hover:bg-red-100 p-2 rounded'><Trash size={16} /></button>}
            </div>

            {hash && (
                <div>
                    <p className="text-sm text-gray-800 bg-gray-100 border border-gray-200 rounded px-3 py-2 mb-4">
                        <span className="font-medium text-black">SHA256:</span>
                        <p className='truncate'>{hash}</p>
                    </p>
                    <input type="text" placeholder='Add note for the file ; degree-certificate' value={note} onChange={(e) => { setNote(e.target.value) }} className="w-full my-3 border text-black border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
            )}

            <button
                onClick={() => storeHashOnChain(hash)}
                disabled={!hash}
                className="w-full py-2 px-4 bg-black text-white font-semibold rounded-lg shadow hover:bg-gray-900 transition disabled:opacity-50"
            >
                {uploading ? <LoaderAnimation /> : "Store Hash on Solana"}
            </button>
            {showLink && (
                <div className="mt-4 p-3 border      rounded-lg bg-gray-50">
                    <p className="text-slate-500 font-medium mb-2">
                        File details uploaded successfully!
                    </p>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/verify/${hash}`}
                            className="flex-1 bg-white border text-black  rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            onFocus={(e) => e.target.select()}
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/verify/${hash}`)
                            }}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-green-700 text-sm transition"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}

