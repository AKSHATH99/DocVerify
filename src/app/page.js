'use client';
import WalletConnection from './component/WalletConnection';
import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import VerifyHash from './component/VerifyHash.';
import bs58 from 'bs58';


export default function UploadForm() {
  const [hash, setHash] = useState('');
  const wallet = useWallet();
  const { connection } = useConnection();

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

  async function storeHashOnChain(hash) {
    console.log("hash storing:", hash);

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
      }
    }
  }


  return (
    <div className="flex flex-col items-center p-6">

      <WalletConnection />
      <p>
        Upload a file to compute its SHA256 hash:
      </p>
      <input type="file" onChange={handleFileUpload} className="mb-4" />
      {hash && <p className="text-green-500">SHA256: {hash}</p>}

      <button
        onClick={() => storeHashOnChain(hash)}
        disabled={!hash}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Store Hash on Solana
      </button>

      <div className="">
        <VerifyHash />
      </div>
    </div>
  );
}
