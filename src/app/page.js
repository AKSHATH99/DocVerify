'use client';
import HeaderComponent from './component/HeaderComponent';
import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import VerifyHash from './component/VerifyHash.';
import bs58 from 'bs58';
import UploadFile from './component/UploadFile';
import FileHistory from './component/FileHistory';

export default function UploadForm() {
 


  return (
    <div className="flex flex-col items-center ">

      <HeaderComponent />
      <FileHistory/>
      <div className="">
        <UploadFile />
      </div>

      <div className="">
        <VerifyHash />
      </div>
    </div>
  );
}
