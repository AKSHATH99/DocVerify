'use client';
import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import bs58 from 'bs58';
import LoaderAnimation from './LoaderAnimation';
import { FileText, Trash, CircleCheckBig } from 'lucide-react';

export default function UploadFile({ onFileHashComputed }) {

  const [hash, setHash] = useState('');
  const wallet = useWallet();
  const { connection } = useConnection();
  // const [note, setNote] = useState('');
  // const [fileSize, setFileSize] = useState(0);
  // const [fileType, setFileType] = useState("");
  // const [filename, setFileName] = useState("");
  const [files, setFiles] = useState([]);

  const [showLink, setShowLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileloading, setFileLoading] = useState(false);

  const handleFileUpload = async (e) => {
    setFileLoading(true);
    console.log("Files selected:", e.target.files);
    const selectedFiles = Array.from(e.target.files);

    const filePromises = selectedFiles.map(async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async () => {
          const wordArray = CryptoJS.lib.WordArray.create(reader.result);
          const sha256Hash = CryptoJS.SHA256(wordArray).toString();

          let estimatedSol = 0;

          try {
            const latestBlockhash = await connection.getLatestBlockhash(); // 👈 get a valid blockhash

            const dummyTx = new Transaction({
              feePayer: wallet.publicKey || new PublicKey("11111111111111111111111111111111"), // fallback dummy pubkey
              recentBlockhash: latestBlockhash.blockhash, // 👈 set it properly
            }).add({
              keys: [],
              programId: MEMO_PROGRAM_ID,
              data: Buffer.from(sha256Hash, "utf8"),
            });

            const fee = await connection.getFeeForMessage(dummyTx.compileMessage());
            estimatedSol = fee.value / 1e9; // lamports → SOL
          } catch (err) {
            console.error("Error estimating fee:", err);
          }

          resolve({
            filename: file.name || "Unknown",
            fileSize: file.size,
            fileType: file.type || "Unknown",
            hash: sha256Hash,
            note: "",
            estimatedSol,
            url: URL.createObjectURL(file),
            uploaded: false
          });
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });


    const results = await Promise.all(filePromises);
    setFiles(prev => [...prev, ...results]); // append new hashed files to your state
    setFileLoading(false);
  };

  useEffect(() => {
    files.map(fileObj => {
      console.log("Computed hash for file:", fileObj.filename, fileObj.hash, fileObj.note);
    })
  }, [files]);

  const handleNoteChange = (index, newNote) => {
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], note: newNote };
      return updatedFiles;
    });
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


  async function storeHashOnChainForFile(fileObj) {
    console.log("hash storing for file:", fileObj.filename, fileObj.hash);
    setUploading(true);

    try {
      const transaction = new Transaction().add({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(fileObj.hash, "utf8"),
      });

      const sig = await wallet.sendTransaction(transaction, connection);
      console.log("⏳ Waiting for confirmation...", sig);

      await connection.confirmTransaction(sig, "confirmed");
      console.log("✅ Stored on-chain! Signature:", sig);

      const txInfo = await connection.getTransaction(sig, { commitment: 'confirmed' });
      const actualSolUsed = txInfo?.meta?.fee ? txInfo.meta.fee / 1e9 : 0;

      const tx = await connection.getTransaction(sig, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        console.log("⚠️ Transaction not found (maybe not confirmed yet)");
        throw new Error("Transaction not found");
      }

      console.log("🔍 Full Transaction:", tx);

      for (let ix of tx.transaction.message.instructions) {
        const programId = tx.transaction.message.accountKeys[ix.programIdIndex].toString();
        if (programId === MEMO_PROGRAM_ID.toString()) {
          const memoBytes = bs58.decode(ix.data);
          const memoData = new TextDecoder("utf-8").decode(memoBytes);
          console.log("📝 Memo stored on-chain:", memoData);

          const userid = localStorage.getItem('user_id');
          const res = await uploadFileDetails({
            user_id: userid,
            file_name: fileObj.filename,
            file_hash: memoData,                 // from chain (decoded)
            transaction_signature: sig,
            file_type: fileObj.fileType,
            file_size: fileObj.fileSize,
            note: fileObj.note,
            wallet_address: wallet.publicKey.toString()
          });

          if (!res || res.success === false) {
            console.error("DB upload failed:", res);
          } else {
            console.log("✅ File details saved to DB for", fileObj.filename);
          }

          setShowLink(true);
          setFiles(prevFiles => {
            return prevFiles.map(f =>
              f.hash === fileObj.hash && f.filename === fileObj.filename
                ? { ...f, uploaded: true, actualSolUsed }
                : f
            );
          });

          const userLoggedIn = localStorage.getItem("user_id");
          if (userLoggedIn) {
            window.dispatchEvent(new Event("file-uploaded"));
          }
          break; // memo found and processed; break out
        }
      }
    } catch (err) {
      console.error("Error uploading file to chain/db:", err);
    } finally {
      setUploading(false);
    }
  }
  const getFilePreview = (fileObj) => {
    const ext = fileObj.filename.split('.').pop().toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      return <img src={fileObj.url} alt={fileObj.filename} className="w-20 h-20 object-cover rounded" />;
    } else if (ext === 'pdf') {
      return <FileText className="w-10 h-10 text-red-600" />; // Your PDF icon component
    } else if (ext === 'txt') {
      return <FileText className="w-10 h-10 text-gray-600" />; // Your TXT icon component
    } else {
      return <FileText className="w-10 h-10 text-gray-400" />; // Generic file icon
    }
  };


  async function storeAllFiles() {
    const pendingFiles = files.filter(f => !f.uploaded);
    for (const file of pendingFiles) {
      await storeHashOnChainForFile(file);
    }

  }

  const handleDeleteFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-8 py-6">
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Upload a file to compute its SHA256 hash:
      </p>

      <div className="flex items-center gap-3 ">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 h-14 p-4 "
        />
        {files.length > 0 && (
          <button
            onClick={() => setFiles([])}
            className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 p-2 rounded transition"
          >
            <Trash size={18} />
          </button>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-6">
          {files.map((fileObj, index) => (
            <div
              key={index}
              className={`p-5 rounded-lg border flex-shrink-0 w-full sm:w-[48%] lg:w-[%] transition
          ${fileObj.uploaded
                  ? 'bg-green-100 dark:bg-green-950 border-green-500 dark:border-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700/40'}`}
            >
              {getFilePreview(fileObj)}

              <p className="truncate text-gray-800 dark:text-gray-300 text-lg">
                {fileObj.filename}
              </p>

              <div className="bg-gray-800/60 my-4 hover:bg-gray-800 rounded-xl p-3 transition-all duration-300 shadow-sm border border-gray-700">
                <span className="f text-gray-900 dark:text-gray-100">SHA256:</span>
                <p className="truncate text-gray-800 dark:text-gray-300">{fileObj.hash}</p>
              </div>

              {fileObj.uploaded ? (
                // ✅ Uploaded state
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4 mt-4 shadow-sm">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <CircleCheckBig size={22} className="text-green-600" />
                    <span>File Uploaded Successfully</span>
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    <span className="text-gray-500">SOL Spent:</span>{" "}
                    <span className="text-green-700">{fileObj.actualSolUsed.toFixed(6)} SOL</span>
                  </div>
                </div>

              ) : (
                // ⏳ Pending state
                <>
                  <p className="text-lg text-green-300">
                    Estimated cost: {fileObj.estimatedSol.toFixed(6)} SOL
                  </p>

                  <input
                    type="text"
                    placeholder="Add note for the file (e.g., degree certificate)"
                    value={fileObj.note}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                    className="w-full my-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleDeleteFile(index)}
                      className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 p-2 rounded transition"
                    >
                      <Trash size={16} />
                    </button>
                    <button
                      onClick={() => storeHashOnChainForFile(fileObj)}
                      className="px-4 py-1.5 bg-black dark:bg-purple-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-purple-800 transition"
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Store on Chain"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {fileloading && (
        <div className="mt-4">
          <LoaderAnimation />
        </div>
      )}
      <button
        onClick={() => storeAllFiles()}
        disabled={files.length === 0 || uploading}
        className="w-full mt-10 py-3 px-6 bg-black dark:bg-purple-700 text-white font-semibold rounded-lg shadow hover:bg-gray-900 dark:hover:bg-purple-800 transition disabled:opacity-50"
      >
        {uploading ? <LoaderAnimation /> : "Store All Files Hash on Solana"}
      </button>

      {showLink && (
        <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/40">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">
            File details uploaded successfully!
          </p>

          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/verify/${hash}`}
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={() =>
                navigator.clipboard.writeText(`${window.location.origin}/verify/${hash}`)
              }
              className="px-4 py-2 bg-gray-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 text-sm transition"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>

  )
}

