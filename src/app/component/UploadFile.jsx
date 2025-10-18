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

          const hashAlreadyExists = await verifyHashOnChain(sha256Hash, wallet.publicKey.toString());

          if (hashAlreadyExists) {
            console.log("Hash already exists on-chain. Skipping upload for file:", file.name);
            setFiles(prevFiles => {
              return prevFiles.map(f =>
                f.hash === sha256Hash && f.filename === file.name
                  ? { ...f, uploaded: true, actualSolUsed: 0, }
                  : f
              );
            });
          } else {
            try {
              const latestBlockhash = await connection.getLatestBlockhash();

              const dummyTx = new Transaction({
                feePayer: wallet.publicKey || new PublicKey("11111111111111111111111111111111"),
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
            }
          }

          resolve({
            filename: file.name || "Unknown",
            fileSize: file.size,
            fileType: file.type || "Unknown",
            hash: sha256Hash,
            note: "",
            estimatedSol: estimatedSol ? estimatedSol : 0,
            url: URL.createObjectURL(file),
            uploaded: false,
            alreadyExist: hashAlreadyExists
          });
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });

    const results = await Promise.all(filePromises);
    setFiles(prev => [...prev, ...results]);
    setFileLoading(false);
  };

  useEffect(() => {
    files.map(fileObj => {
      console.log("Computed hash for file:", fileObj);
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

      if (!tx) continue;

      for (let ix of tx.transaction.message.instructions) {
        const programId = tx.transaction.message.accountKeys[ix.programIdIndex].toString();

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
            file_hash: memoData,
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
          break;
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
      return <img src={fileObj.url} alt={fileObj.filename} className="w-16 h-16 object-cover rounded" />;
    } else if (ext === 'pdf') {
      return <FileText className="w-8 h-8 text-red-400" />;
    } else if (ext === 'txt') {
      return <FileText className="w-8 h-8 text-gray-400" />;
    } else {
      return <FileText className="w-8 h-8 text-gray-500" />;
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
    <div className="w-full flex flex-col items-start justify-center mt-16 px-8">
      {/* Heading */}
      <div className="flex items-center gap-3 mb-2">
        <Upload className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-semibold text-white">
          Upload  Files Hash to Solana
        </h2>
      </div>

      {/* Subtext */}
      <p className="text-gray-400 mb-8 text-sm leading-relaxed flex gap-2">
        Upload files to compute their SHA256 hash and store it permanently on the Solana blockchain.
        <Info className="w-5 hover:cursor-pointer" onClick={() => setInfoTooltip(!infoTooltip)} />
      </p>

      <div className="w-full max-w-2xl mb-6">
        <input
          type="file"
          multiple
          onChange={(e) => { handleFileUpload(e); setActiveModal("upload"); }}
          className="w-full px-4 py-3 bg-[#1E1E1E] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-600 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-800 file:text-gray-300 file:cursor-pointer hover:file:bg-gray-700"
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
                ? 'bg-gradient-to-br from-green-950/40 to-gray-900/40 border-green-500/30'
                : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  {getFilePreview(fileObj)}
                </div>
                <div className="flex-1">
                  <p className="text-gray-100 font-semibold text-base mb-2 truncate">
                    {fileObj.filename}
                  </p>

                  <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-500 text-xs font-medium">SHA256:</span>
                    </div>
                    <p className="text-gray-300 font-mono text-xs break-all">{fileObj.hash}</p>
                  </div>

                  {fileObj.uploaded ? (
                    <div className="bg-green-950/40 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-400 font-semibold text-sm mb-1">
                        <CircleCheckBig size={18} />
                        <span>File Uploaded Successfully</span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        <span>SOL Spent:</span>{" "}
                        <span className="text-green-400">{fileObj.actualSolUsed.toFixed(6)} SOL</span>
                      </p>
                    </div>
                  ) : (
                    <>
                      {!fileObj.alreadyExist && (
                        <>
                          <p className="text-blue-400 text-sm mb-2">
                            Estimated cost: {fileObj.estimatedSol.toFixed(6)} SOL
                          </p>

                          <input
                            type="text"
                            placeholder="Add note (e.g., degree certificate)"
                            value={fileObj.note}
                            onChange={(e) => handleNoteChange(index, e.target.value)}
                            className="w-full mb-3 px-3 py-2 bg-[#1E1E1E] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </>
                      )}

                      {fileObj.alreadyExist && (
                        <p className="text-yellow-500 text-sm mb-2">
                          This file's hash already exists on-chain.
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteFile(index)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash size={16} />
                        </button>
                        <button
                          onClick={() => storeHashOnChainForFile(fileObj)}
                          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${uploading || fileObj.alreadyExist
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
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
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
        >
          {uploading ? <LoaderAnimation /> : "Store All Files Hash on Solana"}
        </button>
      )}

      {showLink && (
        <div className="mt-6 w-full max-w-2xl bg-gradient-to-br from-green-950/40 to-gray-900/40 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-400 font-semibold mb-3">
            File details uploaded successfully!
          </p>

          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/verify/${hash}`}
              className="flex-1 bg-[#1E1E1E] border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
        <div className="absolute -top-[159px]  right-20 w-[500px] bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-white font-semibold">How Does This Work?</h4>
            <button onClick={() => setInfoTooltip(false)} className="text-gray-400 hover:text-gray-200">&times;</button>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            <strong className="text-white">For You (Uploader):</strong><br />
            When you upload a file, we create a unique digital fingerprint (hash) of your document. This fingerprint is stored permanently on the blockchain - think of it like a digital notary stamp that can never be erased or changed.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            <strong className="text-white">For Recipients:</strong><br />
            Anyone who receives your document can verify its authenticity by uploading it to our verification page. If the fingerprint matches, they know the document is genuine and hasn't been altered - no technical knowledge required!
          </p>
        </div>
      )}
    </div>
  );
}