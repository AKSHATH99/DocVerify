'use client';
import HeaderComponent from './component/HeaderComponent';
import React, { useEffect, useState } from 'react';
import VerifyHash from './component/VerifyHash.';
import UploadFile from './component/UploadFile';
import FileHistory from './component/FileHistory';

import { FileText, Hash, FileType, Search, Shield, Upload, GlobeLock } from "lucide-react";

export default function UploadForm() {
  const [activeModal, setActiveModal] = useState("both");

  useEffect(() => {
    console.log("Active Modal:", activeModal);
  }, [activeModal]);

  const toggleComponent = () => {
    if (activeModal === "upload") {
      setActiveModal("verify");
    } else {
      setActiveModal("upload");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <HeaderComponent />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-gray-900/70 border-r border-gray-800 p-4 overflow-y-auto backdrop-blur-sm hidden md:block">
          {activeModal !== "both" && (
            <div className="mt-4 mb-6">
              <button
                onClick={toggleComponent}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {activeModal === "upload" ? <Shield /> : <GlobeLock />}
                </span>
                <span className="transition-all duration-300">
                  {activeModal === "upload" ? "Verify a Document" : "Upload New File"}
                </span>
              </button>
            </div>
          )}
          <FileHistory activeModal={activeModal} setActiveModal={setActiveModal} />
        </aside>
        <main className={`flex-1 p-8 flex flex-col items-center overflow-y-auto transition-all duration-700 ${activeModal === "both" ? "justify-start space-y-10" : "justify-center"
          }`}>
          <div
            className={`w-full max-w-4xl bg-gray-900/70 rounded-2xl border border-gray-800 p-6 shadow-md transition-all duration-700 ease-in-out ${activeModal === "both" || activeModal === "verify"
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-8 scale-95 pointer-events-none h-0 overflow-hidden p-0 border-0"
              }`}
          >
            <VerifyHash setActiveModal={setActiveModal} />
          </div>

          <div
            className={`w-full max-w-4xl bg-gray-900/70 rounded-2xl border border-gray-800 p-6 shadow-md transition-all duration-700 ease-in-out ${activeModal === "both" || activeModal === "upload"
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-95 pointer-events-none h-0 overflow-hidden p-0 border-0"
              }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-center text-purple-400">Upload & Store File</h2>
            <UploadFile setActiveModal={setActiveModal} />
          </div>

          {
            <div className="h-10 mt-10 p-5 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-gray-400">
              {activeModal === "upload" && (
                <>Want to verify a file? Click <button
                  onClick={() => setActiveModal("verify")}
                  className="text-purple-400 underline hover:text-purple-300 ml-1"
                >
                  here
                </button></>
              )}
              {activeModal === "verify" && (
                <>Want to upload a file? Click <button
                  onClick={() => setActiveModal("upload")}
                  className="text-purple-400 underline hover:text-purple-300 ml-1"
                >
                  here
                </button></>
              )}
            </div>
          }
        </main>
      </div>
    </div>
  );
}