"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDownIcon, PhoneIcon, ClockIcon, ShieldCheckIcon, UserIcon } from "@heroicons/react/24/solid";
import { BellIcon, CogIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

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
      <header className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm p-4 flex items-center justify-between border-b border-zinc-800/80">
        <div className="flex items-center">
          <div className="h-9 w-9 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <PhoneIcon className="h-5 w-5 text-white" />
          </div>
          <h1 className="ml-2.5 text-xl font-bold bg-gradient-to-l from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">SafeCall</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-9 w-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
            <BellIcon className="h-5 w-5 text-zinc-300" />
          </button>
          <button className="h-9 w-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
            <UserIcon className="h-5 w-5 text-zinc-300" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-5 max-w-3xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Welcome to SafeCall</h2>
          <p className="text-zinc-400 mt-1">Your personal safety companion</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
              <PhoneIcon className="h-6 w-6 text-white" />
            </div>
            <span className="font-medium text-white">Call Now</span>
            <span className="text-xs text-zinc-400 mt-1">Immediate assistance</span>
          </button>
          
          <button className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:border-teal-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
            <div className="h-12 w-12 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <span className="font-medium text-white">Scheduled Call</span>
            <span className="text-xs text-zinc-400 mt-1">Plan ahead for safety</span>
          </button>
        </div>

        {/* Schedule Call Card */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl shadow-xl border border-zinc-700/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 h-5 w-1 rounded-full mr-3"></span>
              Schedule Your Call
            </h2>
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
              <PhoneIcon className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dropdown 1: Who's Calling */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Who's calling you?
              </label>
              <div className="relative">
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-3 px-4 pr-8 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none transition-colors"
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
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                What's the scenario?
              </label>
              <div className="relative">
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-3 px-4 pr-8 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none transition-colors"
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
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                When should we call?
              </label>
              <div className="relative">
                <select
                  value={selectedTiming}
                  onChange={(e) => setSelectedTiming(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-3 px-4 pr-8 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none transition-colors"
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
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                How urgent is it?
              </label>
              <div className="relative">
                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-3 px-4 pr-8 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none transition-colors"
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
          </div>

          {/* Call Now Button */}
          <button
            onClick={handleCallNow}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-medium py-3.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg shadow-cyan-500/20"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            Call Now
          </button>
        </div>

        {/* Recent Calls Section */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl shadow-xl border border-zinc-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 h-5 w-1 rounded-full mr-3"></span>
              Recent Calls
            </h2>
            <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center transition-colors">
              View all <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-10 px-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div className="h-16 w-16 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full flex items-center justify-center mb-4">
              <PhoneIcon className="h-8 w-8 text-cyan-400/50" />
            </div>
            <p className="text-zinc-300 font-medium">No recent calls</p>
            <p className="text-sm text-zinc-500 mt-1 text-center max-w-xs">Your call history will appear here once you make your first call</p>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800/80 py-3 px-6 flex justify-around">
        <div className="flex flex-col items-center text-cyan-400">
          <PhoneIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Calls</span>
        </div>
        <div className="flex flex-col items-center text-zinc-500 hover:text-cyan-400 transition-colors">
          <ShieldCheckIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Safety</span>
        </div>
        <div className="flex flex-col items-center text-zinc-500 hover:text-cyan-400 transition-colors">
          <CogIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Settings</span>
        </div>
      </nav>
    </div>
  );
}