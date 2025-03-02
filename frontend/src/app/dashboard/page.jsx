"use client";

import { Fragment, useState, useEffect } from "react";
import { Disclosure, Menu, Transition, Dialog } from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  ArrowRightIcon,
  CogIcon,
  MicrophoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import {
  PhoneIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserIcon,
  ChartBarIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import dynamic from "next/dynamic";
import DashboardTable from "../components/DashboardTable";
import EmergencyAlert from "../components/EmergencyAlert";
import { toast } from "react-hot-toast";
import "leaflet/dist/leaflet.css";

// Phone number for emergency calls
const EMERGENCY_PHONE_NUMBER = "+18777063518";

// Dynamically import the Map component with no SSR to avoid hydration issues
const MapComponent = dynamic(
  () => import("../components/MapComponent"),
  { ssr: false }
);

const user = {
  name: "Alex Johnson",
  email: "alex@example.com",
  imageUrl:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};

const navigation = [
  { name: "Dashboard", href: "#", current: true },
  { name: "Scheduled Calls", href: "#", current: false },
  { name: "Safety Contacts", href: "#", current: false },
  { name: "History", href: "#", current: false },
];

const userNavigation = [
  { name: "Your Profile", href: "#" },
  { name: "Settings", href: "#" },
  { name: "Sign out", href: "#" },
];

const stats = [
  { name: "Total Calls", stat: "12", icon: PhoneIcon },
  { name: "Scheduled", stat: "3", icon: CalendarIcon },
  { name: "Safety Score", stat: "98%", icon: ShieldCheckIcon },
];

const upcomingCalls = [
  {
    id: 1,
    caller: "Boss",
    scenario: "Work emergency",
    time: "Today, 5:30 PM",
    urgency: "Medium",
  },
  {
    id: 2,
    caller: "Parent",
    scenario: "Safety check",
    time: "Tomorrow, 9:00 AM",
    urgency: "Low",
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Dashboard() {
  const [isActiveCallModalOpen, setIsActiveCallModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testSpeaker, setTestSpeaker] = useState("Caller");
  const [activeCall, setActiveCall] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  const [isPoliceNotified, setIsPoliceNotified] = useState(false);
  const [emergencyAlarmActive, setEmergencyAlarmActive] = useState(false);
  const [emergencyInsight, setEmergencyInsight] = useState(null);

  // Initialize a call when the modal is opened
  useEffect(() => {
    if (isActiveCallModalOpen && !activeCall) {
      startCall({
        caller: "Friend",
        riskLevel: "medium",
      });
    }
  }, [isActiveCallModalOpen, activeCall]);

  // End the call when the modal is closed
  useEffect(() => {
    if (!isActiveCallModalOpen && activeCall) {
      endCall();
    }
  }, [isActiveCallModalOpen, activeCall]);

  // Map insight type to icon
  const getInsightIcon = (type) => {
    switch (type) {
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-300" />;
      case "alert":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-300" />;
      case "info":
        return <PhoneIcon className="h-5 w-5 text-blue-300" />;
      default:
        return <MicrophoneIcon className="h-5 w-5 text-cyan-300" />;
    }
  };

  // Function to start a call
  const startCall = (callInfo) => {
    setActiveCall({
      ...callInfo,
      startTime: new Date().toISOString(),
    });

    // Fetch initial data when starting a call
    fetchLatestData();
  };

  // Function to end a call
  const endCall = () => {
    setActiveCall(null);
    setTranscriptions([]);
    setInsights([]);
  };

  // Function to send a test message to the webhook
  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;

    try {
      // Generate unique IDs based on timestamp
      const uniqueId = Date.now();
      
      // Create a sample data object
      const data = {
        transcriptions: [
          {
            id: uniqueId,
            speaker: testSpeaker,
            text: testMessage,
            time: new Date().toLocaleTimeString([], {
              minute: "2-digit",
              second: "2-digit",
            }),
            sentiment: testSpeaker === "Caller" ? "anxious" : "supportive",
          },
        ],
        insights: []
      };
      
      // Add insight if it's a caller message with "help"
      if (testSpeaker === 'Caller' && testMessage.toLowerCase().includes('help')) {
        data.insights.push({
          id: uniqueId + 1,
          type: 'warning',
          text: `Detected keyword: "help" in ${testSpeaker}'s message`
        });
      }
      
      // Send to the webhook
      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send data to webhook");
      }

      // Clear the input field
      setTestMessage("");

      // Fetch the latest data
      fetchLatestData();
    } catch (error) {
      console.error("Error sending test message:", error);
      alert("Failed to send test message: " + error.message);
    }
  };

  // Function to fetch the latest data from the webhook
  const fetchLatestData = async () => {
    try {
      const response = await fetch("/api/webhook");

      if (!response.ok) {
        throw new Error("Failed to fetch data from webhook");
      }

      const data = await response.json();

      // Update the local state with the fetched data
      if (data.transcriptions && Array.isArray(data.transcriptions)) {
        // Filter out partial transcriptions if there are complete ones
        const completeTranscriptions = data.transcriptions.filter(t => !t.is_partial);
        const partialTranscriptions = data.transcriptions.filter(t => t.is_partial);
        
        // Only keep partial transcriptions if there are no complete ones
        if (completeTranscriptions.length > 0) {
          setTranscriptions(completeTranscriptions);
        } else {
          setTranscriptions(data.transcriptions);
        }
        
        // Sort transcriptions by ID (chronological order)
        setTranscriptions(prev => [...prev].sort((a, b) => a.id - b.id));
      }
      
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
        // Sort insights by ID (chronological order)
        setInsights(prev => [...prev].sort((a, b) => a.id - b.id));
        
        // Check for emergency insights
        const foundEmergencyInsight = data.insights.find(insight => 
          insight.type === "emergency" && insight.action === "notify_police"
        );
        
        if (foundEmergencyInsight && !emergencyDetected) {
          setEmergencyInsight(foundEmergencyInsight);
          setEmergencyDetected(true);
        }
      }
      
      console.log('Fetched data from webhook:', {
        transcriptionsCount: data.transcriptions?.length || 0,
        insightsCount: data.insights?.length || 0
      });
    } catch (error) {
      console.error("Error fetching latest data:", error);
    }
  };

  // Fetch the latest data when the modal is opened
  useEffect(() => {
    if (isActiveCallModalOpen) {
      fetchLatestData();

      // Set up polling to fetch data every 2 seconds
      const intervalId = setInterval(fetchLatestData, 2000);

      // Clean up the interval when the modal is closed
      return () => clearInterval(intervalId);
    }
  }, [isActiveCallModalOpen]);

  // Track location when the modal is opened
  useEffect(() => {
    if (isActiveCallModalOpen && !currentLocation) {
      // Get location only once when the modal is opened
      getCurrentLocation();
    }
  }, [isActiveCallModalOpen, currentLocation]);
  
  // Function to get current location
  const getCurrentLocation = () => {
    // Hardcoded location coordinates
    setCurrentLocation({
      latitude: 39.680473,
      longitude: -75.753120,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    });
    setLocationError(null);
    
    // Note: We're no longer using navigator.geolocation to avoid any potential issues
  };

  // Calculate call duration
  const getCallDuration = () => {
    if (!activeCall) return "00:00";

    const startTime = new Date(activeCall.startTime);
    const now = new Date();
    const diffInSeconds = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(diffInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (diffInSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  };

  const shareLocationWithAuthorities = async () => {
    if (!currentLocation) {
      toast.error("Unable to share location: Location data not available");
      return false;
    }
    
    try {
      // In a real app, this would send the location to emergency services
      console.log("Sharing location with authorities:", currentLocation);
      
      // Simulate API call to emergency services
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Location shared with emergency services");
      return true;
    } catch (error) {
      console.error("Error sharing location:", error);
      toast.error("Failed to share location with emergency services");
      return false;
    }
  };

  // Replace the handleEmergencyDetected function with notifyPolice
  const notifyPolice = async () => {
    setIsPoliceNotified(true);
    
    try {
      // First share location
      const locationShared = await shareLocationWithAuthorities();
      
      // Then alert authorities about the emergency
      toast.success("Police have been notified", { duration: 5000 });
      
      // Additional information about what happens next
      setTimeout(() => {
        toast("Emergency services have been dispatched to your location", {
          duration: 5000,
          icon: '🚑',
          style: {
            borderRadius: '10px',
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #3b82f6',
          },
        });
      }, 2000);
      
      if (locationShared) {
        setTimeout(() => {
          toast("Your live location is being tracked by emergency services", {
            duration: 5000,
            icon: '📍',
            style: {
              borderRadius: '10px',
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #3b82f6',
            },
          });
        }, 4000);
      }
    } catch (error) {
      console.error("Error notifying police:", error);
      toast.error("Failed to notify police - please call 911");
      setIsPoliceNotified(false);
    }
  };
  
  // Function to stop the alarm
  const stopAlarm = () => {
    setEmergencyAlarmActive(false);
  };

  // Function to handle emergency call button click
  const handleEmergencyCall = () => {
    setIsCallModalOpen(true);
  };

  // Function to initiate the actual call
  const initiateCall = () => {
    // Use the tel: protocol to initiate a phone call
    window.location.href = `tel:${EMERGENCY_PHONE_NUMBER}`;
    
    // Show a toast notification
    toast.success("Initiating emergency call...", {
      icon: '📞',
      style: {
        borderRadius: '10px',
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #3b82f6',
      },
    });
    
    // Close the modal
    setIsCallModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <Disclosure
        as="nav"
        className="bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800/80"
      >
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-9 w-9 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <PhoneIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-2.5">
                    <h1 className="text-xl font-bold bg-gradient-to-l from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                      SafeCall
                    </h1>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                            "rounded-md px-3 py-2 text-sm font-medium"
                          )}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-5 w-5 text-zinc-300" />
                    </button>

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="relative flex max-w-xs items-center rounded-full bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-800">
                          <span className="sr-only">Open user menu</span>
                          <img
                            className="h-8 w-8 rounded-full"
                            src={user.imageUrl}
                            alt=""
                          />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-zinc-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {userNavigation.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <a
                                  href={item.href}
                                  className={classNames(
                                    active ? "bg-zinc-700" : "",
                                    "block px-4 py-2 text-sm text-zinc-300"
                                  )}
                                >
                                  {item.name}
                                </a>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
                <div className="-mr-2 flex md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-800">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      item.current
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-300 hover:bg-zinc-700 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              <div className="border-t border-zinc-700 pb-3 pt-4">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.imageUrl}
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user.name}
                    </div>
                    <div className="text-sm font-medium text-zinc-400">
                      {user.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-auto flex-shrink-0 rounded-full bg-zinc-800 p-1 text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  {userNavigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-base font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <header className="bg-zinc-900 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Admin Dashboard
            </h1>
            <button
              onClick={() => setIsActiveCallModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 hover:from-blue-500/20 hover:via-cyan-500/20 hover:to-teal-500/20 border border-cyan-500/30 rounded-lg px-4 py-2 transition-all duration-300"
            >
              <div className="relative">
                <PhoneIcon className="h-5 w-5 text-cyan-400" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <span className="text-md font-medium text-white">
                Active Call
              </span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {/* Stats section */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {stats.map((item) => (
              <div
                key={item.name}
                className="bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden rounded-lg shadow-xl border border-zinc-700/50 px-4 py-5 sm:p-6"
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20 mr-4">
                    <item.icon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <dt className="truncate text-sm font-medium text-zinc-400">
                      {item.name}
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                      {item.stat}
                    </dd>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <button 
              onClick={handleEmergencyCall}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <PhoneIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-white">Emergency Call</span>
              <span className="text-xs text-zinc-400 mt-1">
                Immediate assistance
              </span>
            </button>

            <button className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:border-teal-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
              <div className="h-12 w-12 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-white">Schedule Call</span>
              <span className="text-xs text-zinc-400 mt-1">
                Plan ahead for safety
              </span>
            </button>

            <button className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
              <div className="h-12 w-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-white">Add Contact</span>
              <span className="text-xs text-zinc-400 mt-1">
                Manage safety contacts
              </span>
            </button>

            <button className="bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-white">Analytics</span>
              <span className="text-xs text-zinc-400 mt-1">
                View safety insights
              </span>
            </button>
          </div>

          {/* Upcoming Calls */}
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl shadow-xl border border-zinc-700/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 h-5 w-1 rounded-full mr-3"></span>
                Upcoming Calls
              </h2>
              <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center transition-colors">
                View all <ArrowRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>

            {upcomingCalls.length > 0 ? (
              <div className="overflow-hidden rounded-lg">
                <ul role="list" className="divide-y divide-zinc-700/50">
                  {upcomingCalls.map((call) => (
                    <li
                      key={call.id}
                      className="flex items-center justify-between gap-x-6 py-5 px-4 hover:bg-zinc-800/50 rounded-lg transition-colors"
                    >
                      <div className="flex min-w-0 gap-x-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full flex items-center justify-center">
                          <PhoneIcon className="h-6 w-6 text-cyan-400/70" />
                        </div>
                        <div className="min-w-0 flex-auto">
                          <p className="text-sm font-semibold leading-6 text-white">
                            {call.caller}
                          </p>
                          <p className="mt-1 truncate text-xs leading-5 text-zinc-400">
                            {call.scenario}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm leading-6 text-white">
                          {call.time}
                        </p>
                        <div className="mt-1 flex items-center gap-x-1.5">
                          <div className="flex-none rounded-full bg-cyan-500/20 p-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                          </div>
                          <p className="text-xs leading-5 text-zinc-400">
                            {call.urgency}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="h-16 w-16 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full flex items-center justify-center mb-4">
                  <ClockIcon className="h-8 w-8 text-cyan-400/50" />
                </div>
                <p className="text-zinc-300 font-medium">No upcoming calls</p>
                <p className="text-sm text-zinc-500 mt-1 text-center max-w-xs">
                  Schedule a call to see it appear here
                </p>
              </div>
            )}
          </div>
          {/* <DashboardTable /> */}
        </div>
      </main>

      {/* Active Call Modal */}
      <Transition appear show={isActiveCallModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsActiveCallModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-zinc-900 border border-zinc-700/50 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
                  <div className="bg-zinc-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title
                          as="h3"
                          className="text-xl font-semibold leading-6 text-white flex items-center"
                        >
                          <div className="h-8 w-8 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-full flex items-center justify-center mr-3">
                            <PhoneIcon className="h-4 w-4 text-cyan-400" />
                          </div>
                          Active Call
                          <span className="ml-3 text-sm font-normal text-zinc-400">
                            {getCallDuration()}
                          </span>
                        </Dialog.Title>
                        
                        {/* Emergency Alert Banner */}
                        {emergencyDetected && (
                          <div className="mt-4">
                            <EmergencyAlert 
                              emergencyInsight={emergencyInsight}
                              onNotifyPolice={notifyPolice}
                              isPoliceNotified={isPoliceNotified}
                              shareLocation={shareLocationWithAuthorities}
                            />
                          </div>
                        )}
                        
                        {/* Three-column layout */}
                        <div className="mt-6 flex flex-col md:flex-row gap-6 h-[70vh]">
                          
                          {/* Left Column - Map */}
                          <div className="w-full md:w-1/4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-zinc-700/50">
                              <h4 className="text-sm font-medium text-white flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-1 text-cyan-400" />
                                Live Location
                              </h4>
                            </div>
                            
                            <div className="flex-1 p-4 overflow-y-auto">
                              {locationError ? (
                                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                                  <p className="text-sm text-red-300">
                                    {locationError}
                                  </p>
                                </div>
                              ) : currentLocation ? (
                                <div className="h-full flex flex-col">
                                  {/* Location Map Preview */}
                                  <div className="flex-1 mb-4 rounded-lg overflow-hidden border border-zinc-700/50 relative">
                                    <MapComponent location={currentLocation} height="340px" />
                                  </div>
                                  
                                  {/* Location Details */}
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-400">Latitude:</span>
                                      <span className="text-white">
                                        {currentLocation.latitude.toFixed(6)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-400">Longitude:</span>
                                      <span className="text-white">
                                        {currentLocation.longitude.toFixed(6)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-400">Accuracy:</span>
                                      <span className="text-white">
                                        {currentLocation.accuracy.toFixed(0)} m
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-400">Captured at:</span>
                                      <span className="text-white">
                                        {new Date(currentLocation.timestamp).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <div className="text-center py-4">
                                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 flex items-center justify-center animate-pulse">
                                      <MapPinIcon className="h-8 w-8 text-cyan-400/70" />
                                    </div>
                                    <p className="text-sm text-zinc-400">Getting location...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Alert Authorities Button */}
                            <div className="p-4 border-t border-zinc-700/50">
                              <button
                                onClick={notifyPolice}
                                disabled={isPoliceNotified}
                                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                                  isPoliceNotified
                                    ? "bg-green-500/30 text-green-300 cursor-not-allowed"
                                    : "bg-red-500 text-white hover:bg-red-600 transition-colors"
                                }`}
                              >
                                {isPoliceNotified ? (
                                  <>
                                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                                    <span>Police Notified</span>
                                  </>
                                ) : (
                                  <>
                                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                    <span>Notify Police</span>
                                  </>
                                )}
                              </button>
                              {isPoliceNotified && (
                                <p className="text-xs text-center mt-2 text-zinc-400">
                                  Emergency services have been notified with your location
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Middle Column - Transcriptions */}
                          <div className="w-full md:w-2/4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-zinc-700/50">
                              <h4 className="text-sm font-medium text-white flex items-center">
                                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1 text-cyan-400" />
                                Conversation
                              </h4>
                            </div>
                            
                            <div className="flex-1 p-4 overflow-y-auto pr-2">
                              <div className="space-y-4">
                                {transcriptions.map((transcription) => (
                                  <div
                                    key={transcription.id}
                                    className={`flex ${
                                      transcription.speaker === "You"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <div
                                      className={`rounded-lg px-5 py-3 max-w-[90%] ${
                                        transcription.speaker === "You"
                                          ? "bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 text-white"
                                          : "bg-zinc-800 text-white"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-1.5">
                                        <span
                                          className={`text-xs font-medium ${
                                            transcription.speaker === "You"
                                              ? "text-cyan-400"
                                              : "text-zinc-400"
                                          }`}
                                        >
                                          {transcription.speaker}
                                        </span>
                                        <span className="text-xs text-zinc-500 ml-2">
                                          {transcription.time}
                                        </span>
                                      </div>
                                      <p className="text-sm leading-relaxed">{transcription.text}</p>
                                    </div>
                                  </div>
                                ))}
                                
                                {transcriptions.length === 0 && (
                                  <div className="flex items-center justify-center h-full">
                                    <div className="text-center py-8">
                                      <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 flex items-center justify-center">
                                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-cyan-400/50" />
                                      </div>
                                      <p className="text-sm text-zinc-400">No transcriptions yet</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Test Message Input */}
                            <div className="hidden p-4 border-t border-zinc-700/50">
                              <div className="flex items-center">
                                <div className="relative flex-1">
                                  <select
                                    value={testSpeaker}
                                    onChange={(e) => setTestSpeaker(e.target.value)}
                                    className="absolute left-0 top-0 h-full rounded-l-lg border-r border-zinc-700 bg-zinc-800 px-3 text-sm text-white focus:outline-none"
                                  >
                                    <option value="You">You</option>
                                    <option value="Caller">Caller</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    placeholder="Type a test message..."
                                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-20 pr-4 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        sendTestMessage();
                                      }
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={sendTestMessage}
                                  className="ml-2 rounded-lg bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-2 text-white hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 transition-all duration-300"
                                >
                                  <PaperAirplaneIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column - Insights */}
                          <div className="w-full md:w-1/4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-zinc-700/50">
                              <h4 className="text-sm font-medium text-white flex items-center">
                                <LightBulbIcon className="h-4 w-4 mr-1 text-cyan-400" />
                                Call Insights
                              </h4>
                            </div>
                            
                            <div className="flex-1 p-4 overflow-y-auto pr-2">
                              {/* Call Details */}
                              <div className="mb-6">
                                <h4 className="text-sm font-medium text-white mb-3">
                                  Call Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Duration:</span>
                                    <span className="text-white">
                                      {getCallDuration()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Caller:</span>
                                    <span className="text-white">
                                      {activeCall?.caller || "Unknown"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Status:</span>
                                    <span className="text-green-400">Active</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Risk Level:</span>
                                    <span className="text-yellow-400">
                                      {activeCall?.riskLevel || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Insights List */}
                              <div>
                                <h4 className="text-sm font-medium text-white mb-3">
                                  Detected Insights
                                </h4>
                                <div className="space-y-3">
                                  {insights.map((insight) => (
                                    <div
                                      key={insight.id}
                                      className={`p-3 rounded-lg border ${
                                        insight.type === "warning"
                                          ? "border-yellow-500/30 bg-yellow-500/10"
                                          : insight.type === "alert"
                                          ? "border-red-500/30 bg-red-500/10"
                                          : "border-blue-500/30 bg-blue-500/10"
                                      }`}
                                    >
                                      <div className="flex">
                                        <div className="flex-shrink-0">
                                          {getInsightIcon(insight.type)}
                                        </div>
                                        <div className="ml-3">
                                          <p
                                            className={`text-sm ${
                                              insight.type === "warning"
                                                ? "text-yellow-300"
                                                : insight.type === "alert"
                                                ? "text-red-300"
                                                : "text-blue-300"
                                            }`}
                                          >
                                            {insight.text}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {insights.length === 0 && (
                                    <div className="p-3 rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-center">
                                      <div className="py-4">
                                        <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 flex items-center justify-center">
                                          <LightBulbIcon className="h-5 w-5 text-cyan-400/50" />
                                        </div>
                                        <p className="text-sm text-zinc-400">No insights detected yet</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
      
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky bottom-0 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800/80 py-3 px-6 flex justify-around">
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

      {/* Call Modal */}
      <Transition appear show={isCallModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCallModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20 animate-pulse">
                      <PhoneIcon className="h-10 w-10 text-white" />
                    </div>
                    
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold text-white text-center"
                    >
                      Emergency Call
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-center text-zinc-400">
                        You're about to call SafeCall's emergency line
                      </p>
                    </div>

                    <div className="mt-6 mb-8">
                      <p className="text-2xl font-mono text-center text-white tracking-wider">
                        +1 (877) 706-3518
                      </p>
                    </div>

                    <div className="flex gap-4 w-full">
                      <button
                        type="button"
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                        onClick={() => setIsCallModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all flex items-center justify-center"
                        onClick={initiateCall}
                      >
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        Call Now
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
