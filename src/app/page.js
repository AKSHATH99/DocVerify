'use client';
import React, { useState } from 'react';
import CryptoJS from 'crypto-js';

export default function UploadForm() {
  const [hash, setHash] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const wordArray = CryptoJS.lib.WordArray.create(reader.result );
      const sha256Hash = CryptoJS.SHA256(wordArray).toString();
      setHash(sha256Hash);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col items-center p-6">

      <p>
        Upload a file to compute its SHA256 hash:
      </p>
      <p>Find your </p>
      <input type="file" onChange={handleFileUpload} className="mb-4" />
      {hash && <p className="text-green-500">SHA256: {hash}</p>}
    </div>
  );
}
