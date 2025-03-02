"use client";

import { PhoneIcon } from '@heroicons/react/24/solid';

export default function PicturePage() {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="h-96 w-96 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
        <PhoneIcon className="h-48 w-48 text-white" />
      </div>
    </div>
  );
}
