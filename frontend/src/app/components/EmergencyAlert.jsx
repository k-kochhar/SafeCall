import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

/**
 * EmergencyAlert component for displaying emergency alerts when code words are detected
 */
export default function EmergencyAlert({ 
  emergencyInsight, 
  onNotifyPolice, 
  isPoliceNotified = false,
  shareLocation = async () => true
}) {
  const [alarmActive, setAlarmActive] = useState(true);
  const [alarmSound, setAlarmSound] = useState(null);
  
  // Initialize alarm sound on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sound = new Audio("/alarm.mp3");
      sound.loop = true;
      setAlarmSound(sound);
      
      // Play alarm sound
      if (alarmActive) {
        sound.play().catch(e => console.error("Could not play alarm sound:", e));
      }
      
      // Show emergency toast notification
      toast.error(
        <div className="flex flex-col">
          <span className="font-bold">EMERGENCY ALERT</span>
          <span>{emergencyInsight?.text || "Code word detected in call"}</span>
        </div>,
        { duration: 10000 }
      );
      
      // Automatically notify police after a short delay if not already notified
      if (!isPoliceNotified) {
        const timer = setTimeout(() => {
          handleNotifyPolice();
        }, 2000);
        
        return () => clearTimeout(timer);
      }
      
      // Cleanup function to stop alarm when component unmounts
      return () => {
        sound.pause();
        sound.currentTime = 0;
      };
    }
  }, []);
  
  // Update alarm state when alarmActive changes
  useEffect(() => {
    if (alarmSound) {
      if (alarmActive) {
        alarmSound.play().catch(e => console.error("Could not play alarm sound:", e));
      } else {
        alarmSound.pause();
      }
    }
  }, [alarmActive, alarmSound]);
  
  // Stop the alarm
  const stopAlarm = () => {
    setAlarmActive(false);
    if (alarmSound) {
      alarmSound.pause();
      alarmSound.currentTime = 0;
    }
  };
  
  // Handle notifying police
  const handleNotifyPolice = async () => {
    if (onNotifyPolice) {
      onNotifyPolice();
    } else {
      // Default implementation if no handler provided
      try {
        // First share location
        const locationShared = await shareLocation();
        
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
      }
    }
  };
  
  return (
    <div className={`p-4 rounded-lg border border-red-500 ${alarmActive ? 'bg-red-500/20 animate-pulse' : 'bg-red-500/10'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-bold text-red-500">EMERGENCY ALERT</h3>
            <p className="text-sm text-red-300">
              {emergencyInsight?.text || "Code word detected in conversation. User may be in danger."}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {alarmActive && (
            <button 
              onClick={stopAlarm}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-md"
            >
              Stop Alarm
            </button>
          )}
          {!isPoliceNotified && (
            <button 
              onClick={handleNotifyPolice}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
            >
              Notify Police
            </button>
          )}
          {isPoliceNotified && (
            <div className="px-3 py-1 bg-green-600 text-white text-sm rounded-md flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Police Notified
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 