'use client';
import HeaderComponent from './component/HeaderComponent';
import React, { useState } from 'react';
import VerifyHash from './component/VerifyHash.';
import UploadFile from './component/UploadFile';
import FileHistory from './component/FileHistory';

export default function UploadForm() {

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <HeaderComponent />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (File History) */}
        <aside className="w-80 bg-gray-900/70 border-r border-gray-800 p-4 overflow-y-auto backdrop-blur-sm hidden md:block">
          <FileHistory />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 flex flex-col items-center justify-start space-y-8 overflow-y-auto">
          <div className="w-full max-w-3xl">
            <UploadFile />
          </div>

          <div className="w-full max-w-3xl">
            <VerifyHash />
          </div>
        </main>
      </div>
    </div>
  );
}
