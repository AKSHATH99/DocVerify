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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-white transition-colors duration-500">
      <HeaderComponent />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white/60 dark:bg-gray-900/70 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto backdrop-blur-sm hidden md:block transition-colors duration-500">
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

        {/* Main Section */}
        <main
          className={`flex-1 p-8 flex flex-col items-center overflow-y-auto transition-all duration-700 ${activeModal === "both" ? "justify-start space-y-10" : "justify-center"
            }`}
        >
          {/* Verify Section */}
          <div
            className={`w-full max-w-4xl bg-white/70 dark:bg-gray-900/70 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-md transition-all duration-700 ease-in-out ${activeModal === "both" || activeModal === "verify"
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-8 scale-95 pointer-events-none h-0 overflow-hidden p-0 border-0"
              }`}
          >
            <VerifyHash setActiveModal={setActiveModal} />
          </div>

          {/* Upload Section */}
          <div
            className={`w-full max-w-4xl bg-white/70 dark:bg-gray-900/70 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-md transition-all duration-700 ease-in-out ${activeModal === "both" || activeModal === "upload"
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-95 pointer-events-none h-0 overflow-hidden p-0 border-0"
              }`}
          >
            <UploadFile setActiveModal={setActiveModal} />
          </div>

          {/* Switch Prompt */}
          {
            <div className="h-10 mt-10 p-5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors duration-500">
              {activeModal === "upload" && (
                <>
                  Want to verify a file? Click{" "}
                  <button
                    onClick={() => setActiveModal("verify")}
                    className="text-purple-600 dark:text-purple-400 underline hover:text-purple-500 dark:hover:text-purple-300 ml-1"
                  >
                    here
                  </button>
                </>
              )}
              {activeModal === "verify" && (
                <>
                  Want to upload a file? Click{" "}
                  <button
                    onClick={() => setActiveModal("upload")}
                    className="text-purple-600 dark:text-purple-400 underline hover:text-purple-500 dark:hover:text-purple-300 ml-1"
                  >
                    here
                  </button>
                </>
              )}
            </div>
          }
        </main>
      </div>
    </div>

  );
}