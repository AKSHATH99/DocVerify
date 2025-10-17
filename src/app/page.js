'use client';
import HeaderComponent from './component/HeaderComponent';
import React, { useEffect, useState } from 'react';
import VerifyHash from './component/VerifyHash.';
import UploadFile from './component/UploadFile';
import FileHistory from './component/FileHistory';

export default function UploadForm() {

  const [activeModal, setActiveModal] = useState("both");

  useEffect(() => {
    console.log("Active Modal:", activeModal);
  }, [activeModal]);
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <HeaderComponent />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-gray-900/70 border-r border-gray-800 p-4 overflow-y-auto backdrop-blur-sm hidden md:block">
          <FileHistory />
        </aside>

        <main className="flex-1 p-8 flex flex-col items-center justify-start space-y-10 overflow-y-auto">
          {(activeModal === "both" || activeModal === "verify") && (
            <div className="w-full max-w-4xl bg-gray-900/70 rounded-2xl border border-gray-800 p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-center text-purple-400">Verify File Hash</h2>
              <VerifyHash setActiveModal={setActiveModal} />
            </div>
          )}

          {(activeModal === "both" || activeModal === "upload") && (
            <div className="w-full max-w-4xl bg-gray-900/70 rounded-2xl border border-gray-800 p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-center text-purple-400">Upload & Store File</h2>
              <UploadFile setActiveModal={setActiveModal} />
            </div>
          )}
        </main>




      </div>
    </div>
  );
}
