"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDownIcon, PhoneIcon } from "@heroicons/react/24/solid";

export default function Dashboard() {
  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("");
  const [selectedTiming, setSelectedTiming] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState("");

  const handleCallNow = () => {
    console.log("Calling now with settings:", {
      person: selectedPerson,
      scenario: selectedScenario,
      timing: selectedTiming,
      urgency: selectedUrgency,
    });
    // Add API call logic here
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      {/* App Header */}
      <header className="sticky top-0 z-10 bg-zinc-900 p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <PhoneIcon className="h-4 w-4 text-white" />
          </div>
          <h1 className="ml-2 text-xl font-bold bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">SafeCall</h1>
        </div>
        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
          <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-5 max-w-md mx-auto w-full">
        <div className="bg-zinc-800 rounded-xl shadow-lg border border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Schedule Your Call</h2>
          
          {/* Dropdown 1: Who's Calling */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Who's calling you?
            </label>
            <div className="relative">
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 py-3 px-4 pr-8 text-white focus:border-purple-500 focus:outline-none focus:ring-purple-500 appearance-none"
              >
                <option value="">Select caller</option>
                <option value="boss">Boss</option>
                <option value="parent">Parent</option>
                <option value="friend">Friend</option>
                <option value="partner">Partner</option>
                <option value="police">Police Officer</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                <ChevronDownIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Dropdown 2: Scenario */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              What's the scenario?
            </label>
            <div className="relative">
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 py-3 px-4 pr-8 text-white focus:border-purple-500 focus:outline-none focus:ring-purple-500 appearance-none"
              >
                <option value="">Select scenario</option>
                <option value="emergency">Emergency at home</option>
                <option value="work">Work emergency</option>
                <option value="escape">Need to leave social situation</option>
                <option value="safety">Safety check</option>
                <option value="custom">Custom scenario</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                <ChevronDownIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Dropdown 3: Timing */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              When should we call?
            </label>
            <div className="relative">
              <select
                value={selectedTiming}
                onChange={(e) => setSelectedTiming(e.target.value)}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 py-3 px-4 pr-8 text-white focus:border-purple-500 focus:outline-none focus:ring-purple-500 appearance-none"
              >
                <option value="">Select timing</option>
                <option value="now">Right now</option>
                <option value="1min">In 1 minute</option>
                <option value="5min">In 5 minutes</option>
                <option value="15min">In 15 minutes</option>
                <option value="30min">In 30 minutes</option>
                <option value="custom">Custom time</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                <ChevronDownIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Dropdown 4: Urgency */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              How urgent is it?
            </label>
            <div className="relative">
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 py-3 px-4 pr-8 text-white focus:border-purple-500 focus:outline-none focus:ring-purple-500 appearance-none"
              >
                <option value="">Select urgency</option>
                <option value="low">Low - Just an excuse</option>
                <option value="medium">Medium - Need to leave soon</option>
                <option value="high">High - Need to leave now</option>
                <option value="emergency">Emergency - Need help</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                <ChevronDownIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Call Now Button */}
          <button
            onClick={handleCallNow}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center shadow-lg"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            Call Now
          </button>
        </div>

        {/* Recent Calls Section */}
        <div className="bg-zinc-800 rounded-xl shadow-lg border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Calls</h2>
          <div className="text-center text-zinc-400 py-6">
            <p>No recent calls</p>
            <p className="text-sm mt-1">Your call history will appear here</p>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="sticky bottom-0 bg-zinc-900 border-t border-gray-800 py-3 px-6 flex justify-around">
        <div className="flex flex-col items-center text-indigo-400">
          <PhoneIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Calls</span>
        </div>
        <div className="flex flex-col items-center text-zinc-500 hover:text-indigo-400 transition-colors">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-xs mt-1">New</span>
        </div>
        <div className="flex flex-col items-center text-zinc-500 hover:text-indigo-400 transition-colors">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs mt-1">Settings</span>
        </div>
      </nav>
    </div>
  );
}