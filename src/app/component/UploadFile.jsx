'use client';
import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import { Connection, PublicKey, Transaction, SystemProgram, clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import bs58 from 'bs58';
import LoaderAnimation from './LoaderAnimation';
import { FileText, Trash, CircleCheckBig, Upload, Info } from 'lucide-react';

export default function UploadFile({ setActiveModal }) {

  const [hash, setHash] = useState('');
  const wallet = useWallet();
  const { connection } = useConnection();
  const [files, setFiles] = useState([]);
  const [showLink, setShowLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileloading, setFileLoading] = useState(false);
  const [infoTooltip, setInfoTooltip] = useState(false);
  let estimatedSol = 0;
  const [error, setError] = useState(null);


  const handleFileUpload = async (e) => {
    setFileLoading(true);
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Please connect your wallet before uploading files.");
      }

      const selectedFiles = Array.from(e.target.files);
      const filePromises = selectedFiles.map(async (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = async () => {
            try {
              const wordArray = CryptoJS.lib.WordArray.create(reader.result);
              const sha256Hash = CryptoJS.SHA256(wordArray).toString();

              const hashAlreadyExists = await verifyHashOnChain(sha256Hash, wallet.publicKey.toString());

              if (hashAlreadyExists) {
                setFiles(prevFiles => prevFiles.map(f =>
                  f.hash === sha256Hash && f.filename === file.name
                    ? { ...f, uploaded: true, actualSolUsed: 0 }
                    : f
                ));
              } else {
                try {
                  const latestBlockhash = await connection.getLatestBlockhash();

                  const dummyTx = new Transaction({
                    feePayer: wallet.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                  }).add({
                    keys: [],
                    programId: MEMO_PROGRAM_ID,
                    data: Buffer.from(sha256Hash, "utf8"),
                  });

                  const fee = await connection.getFeeForMessage(dummyTx.compileMessage());
                  estimatedSol = fee.value / 1e9;
                } catch (err) {
                  console.error("Error estimating fee:", err);
                  setError("Failed to estimate transaction fee.");
                  estimatedSol = 0;
                }
              }

              resolve({
                filename: file.name || "Unknown",
                fileSize: file.size,
                fileType: file.type || "Unknown",
                hash: sha256Hash,
                note: "",
                estimatedSol: estimatedSol || 0,
                url: URL.createObjectURL(file),
                uploaded: false,
                alreadyExist: hashAlreadyExists
              });
            } catch (err) {
              console.error("File read/processing error:", err);
              setError("Error processing file.");
              reject(err);
            }
          };

          reader.onerror = (err) => {
            console.error("FileReader error:", err);
            setError("Error reading file.");
            reject(err);
          };

          reader.readAsArrayBuffer(file);
        });
      });

      const results = await Promise.all(filePromises);
      setFiles(prev => [...prev, ...results]);
    } catch (err) {
      console.error("File upload error:", err);
      setError(err.message || "File upload failed.");
    } finally {
      setFileLoading(false);
    }
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
      setError("Failed to upload file details to server.");
      return { success: false, error: err.message };
    }
  }

  async function verifyHashOnChain(hash, walletAddress) {
    try {
      if (!walletAddress) {
        throw new Error("Wallet not connected. Please connect your wallet to verify files.");
      }

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const pubKey = new PublicKey(walletAddress);
      const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 20 });

      for (let sigInfo of signatures) {
        const tx = await connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (!tx) continue;

        for (let ix of tx.transaction.message.instructions) {
          const programId = tx.transaction.message.accountKeys[ix.programIdIndex].toString();
          if (programId === MEMO_PROGRAM_ID.toString()) {
            const memoBytes = bs58.decode(ix.data);
            const memoData = new TextDecoder("utf-8").decode(memoBytes);

            if (memoData === hash) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (err) {
      console.error("Error verifying hash on-chain:", err);
      setError("Error verifying hash on Solana blockchain.");
      return false;
    }
  }

  async function storeHashOnChainForFile(fileObj) {
    setUploading(true);
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Please connect your wallet before uploading to the blockchain.");
      }

      const transaction = new Transaction().add({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(fileObj.hash, "utf8"),
      });

      const sig = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(sig, "confirmed");

      const txInfo = await connection.getTransaction(sig, { commitment: 'confirmed' });
      const actualSolUsed = txInfo?.meta?.fee ? txInfo.meta.fee / 1e9 : 0;

      const tx = await connection.getTransaction(sig, {
        maxSupportedTransactionVersion: 0,
      });
      if (!tx) throw new Error("Transaction not found or not yet confirmed.");

      for (let ix of tx.transaction.message.instructions) {
        const programId = tx.transaction.message.accountKeys[ix.programIdIndex].toString();
        if (programId === MEMO_PROGRAM_ID.toString()) {
          const memoBytes = bs58.decode(ix.data);
          const memoData = new TextDecoder("utf-8").decode(memoBytes);

          const userid = localStorage.getItem('user_id');
          const res = await uploadFileDetails({
            user_id: userid,
            file_name: fileObj.filename,
            file_hash: memoData,
            transaction_signature: sig,
            file_type: fileObj.fileType,
            file_size: fileObj.fileSize,
            note: fileObj.note,
            wallet_address: wallet.publicKey.toString()
          });

          if (!res || res.success === false) {
            throw new Error("Failed to upload file details to DB.");
          }

          setShowLink(true);
          setFiles(prevFiles =>
            prevFiles.map(f =>
              f.hash === fileObj.hash && f.filename === fileObj.filename
                ? { ...f, uploaded: true, actualSolUsed }
                : f
            )
          );

          const userLoggedIn = localStorage.getItem("user_id");
          if (userLoggedIn) {
            window.dispatchEvent(new Event("file-uploaded"));
          }
          break;
        }
      }
    } catch (err) {
      console.error("Error uploading file to chain/db:", err);
      setError(err.message || "Error uploading file to blockchain or database.");
    } finally {
      setUploading(false);
    }
  }

  async function storeAllFiles() {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Please connect your wallet before storing files on-chain.");
      }

      const pendingFiles = files.filter(f => !f.uploaded);
      for (const file of pendingFiles) {
        await storeHashOnChainForFile(file);
      }
    } catch (err) {
      console.error("Error storing all files:", err);
      setError(err.message || "Failed to store all files on-chain.");
    }
  }

  const handleDeleteFile = (index) => {
    try {
      setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Error deleting file:", err);
      setError("Failed to delete file from list.");
    }
  };

  const getFilePreview = (fileObj) => {
    try {
      const ext = fileObj.filename.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
        return <img src={fileObj.url} alt={fileObj.filename} className="w-16 h-16 object-cover rounded" />;
      } else if (ext === 'pdf') {
        return <FileText className="w-8 h-8 text-red-400" />;
      } else if (ext === 'txt') {
        return <FileText className="w-8 h-8 text-gray-400" />;
      } else {
        return <FileText className="w-8 h-8 text-gray-500" />;
      }
    } catch (err) {
      console.error("Error rendering file preview:", err);
      return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div className="w-full flex flex-col items-start justify-center mt-16 px-8">
      {/* Heading */}
      <div className="flex items-center gap-3 mb-2">
        <Upload className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Upload Files Hash to Solana
        </h2>
      </div>

      {/* Subtext */}
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm leading-relaxed flex gap-2">
        Upload files to compute their SHA256 hash and store it permanently on the Solana blockchain.
        <Info className="w-5 hover:cursor-pointer" onClick={() => setInfoTooltip(!infoTooltip)} />
      </p>

      <div className="w-full max-w-2xl mb-6">
        <input
          type="file"
          multiple
          onChange={(e) => { handleFileUpload(e); setActiveModal("upload"); }}
          className="w-full px-4 py-3 bg-gray-100 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-200 dark:file:bg-gray-800 file:text-gray-800 dark:file:text-gray-300 file:cursor-pointer hover:file:bg-gray-300 dark:hover:file:bg-gray-700"
        />
      </div>

      {fileloading && (
        <div className="w-full max-w-2xl mb-6">
          <LoaderAnimation />
        </div>
      )}

      {files.length > 0 && (
        <div className="w-full max-w-2xl space-y-4 mb-6">
          {files.map((fileObj, index) => (
            <div
              key={index}
              className={`border rounded-xl p-5 shadow-lg transition-all duration-200 ${fileObj.uploaded
                ? 'bg-gradient-to-br from-green-200/20 dark:from-green-950/40 to-gray-100/10 dark:to-gray-900/40 border-green-400/30 dark:border-green-500/30'
                : 'bg-gradient-to-br from-gray-50 dark:from-gray-900 to-gray-100 dark:to-gray-800 border-gray-300 dark:border-gray-700'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg">
                  {getFilePreview(fileObj)}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-base mb-2 truncate">
                    {fileObj.filename}
                  </p>

                  <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">SHA256:</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-mono text-xs break-all">{fileObj.hash}</p>
                  </div>

                  {fileObj.uploaded ? (
                    <div className="bg-green-200/20 dark:bg-green-950/40 border border-green-400/30 dark:border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm mb-1">
                        <CircleCheckBig size={18} />
                        <span>File Uploaded Successfully</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        <span>SOL Spent:</span>{" "}
                        <span className="text-green-600 dark:text-green-400">{fileObj.actualSolUsed.toFixed(6)} SOL</span>
                      </p>
                    </div>
                  ) : (
                    <>
                      {!fileObj.alreadyExist && (
                        <>
                          <p className="text-blue-600 dark:text-blue-400 text-sm mb-2">
                            Estimated cost: {fileObj.estimatedSol.toFixed(6)} SOL
                          </p>

                          <input
                            type="text"
                            placeholder="Add note (e.g., degree certificate)"
                            value={fileObj.note}
                            onChange={(e) => handleNoteChange(index, e.target.value)}
                            className="w-full mb-3 px-3 py-2 bg-gray-100 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </>
                      )}

                      {fileObj.alreadyExist && (
                        <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-2">
                          This file's hash already exists on-chain.
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteFile(index)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash size={16} />
                        </button>
                        <button
                          onClick={() => storeHashOnChainForFile(fileObj)}
                          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${uploading || fileObj.alreadyExist
                            ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                            }`}
                          disabled={uploading || fileObj.alreadyExist}
                        >
                          {uploading ? "Uploading..." : "Store on Chain"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploading ? (
        <LoaderAnimation />
      ) : (
        <button
          onClick={() => storeAllFiles()}
          disabled={files.length === 0 || uploading}
          className={`w-full max-w-2xl py-3 rounded-lg font-semibold text-center transition-all duration-200 shadow-lg ${files.length > 0 && !uploading
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transform hover:scale-[1.01]'
            : 'bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
        >
          {uploading ? <LoaderAnimation /> : "Store All Files Hash on Solana"}
        </button>
      )}

      {showLink && (
        <div className="mt-6 w-full max-w-2xl bg-gradient-to-br from-green-200/20 dark:from-green-950/40 to-gray-100/10 dark:to-gray-900/40 border border-green-400/30 dark:border-green-500/30 rounded-lg p-4">
          <p className="text-green-600 dark:text-green-400 font-semibold mb-3">
            File details uploaded successfully!
          </p>

          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/verify/${hash}`}
              className="flex-1 bg-gray-100 dark:bg-[#1E1E1E] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={() =>
                navigator.clipboard.writeText(`${window.location.origin}/verify/${hash}`)
              }
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm transition"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {infoTooltip && (
        <div className="absolute -top-[159px] right-20 w-[500px] bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50 transition-colors duration-300">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-gray-900 dark:text-white font-semibold">How Does This Work?</h4>
            <button onClick={() => setInfoTooltip(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
            <strong className="text-gray-900 dark:text-white">For You (Uploader):</strong><br />
            When you upload a file, we create a unique digital fingerprint (hash) of your document. This fingerprint is stored permanently on the blockchain - think of it like a digital notary stamp that can never be erased or changed.
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <strong className="text-gray-900 dark:text-white">For Recipients:</strong><br />
            Anyone who receives your document can verify its authenticity by uploading it to our verification page. If the fingerprint matches, they know the document is genuine and hasn't been altered - no technical knowledge required!
          </p>
        </div>
      )}
      {error && (
        <div className="mt-4 w-full max-w-2xl bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" /></svg>
          </span>
        </div>
      )}
    </div>

  );
}