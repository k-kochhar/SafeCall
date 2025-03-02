/**
 * Test script to demonstrate how to send data to the SafeCall webhook
 * 
 * This script simulates sending transcription data to the webhook.
 * It can be used as a reference for integrating with the webhook.
 * 
 * Usage:
 * 1. Install Node.js
 * 2. Run: node webhook-test-script.js
 */

// Replace with your actual webhook URL
const WEBHOOK_URL = 'http://localhost:3000/api/webhook';

// Generate unique IDs based on timestamp
const baseId = Date.now();

// Sample transcription data
const sampleData = {
  transcriptions: [
    { 
      id: baseId, 
      speaker: 'Caller', 
      text: 'Hey, I need you to come pick me up right now.', 
      time: '00:05', 
      sentiment: 'urgent' 
    },
    { 
      id: baseId + 1, 
      speaker: 'You', 
      text: 'What\'s going on? Are you okay?', 
      time: '00:08', 
      sentiment: 'concerned' 
    },
    { 
      id: baseId + 2, 
      speaker: 'Caller', 
      text: 'I\'m at the party we talked about, but I don\'t feel safe here. Can you come get me?', 
      time: '00:15', 
      sentiment: 'anxious' 
    }
  ],
  insights: [
    { 
      id: baseId + 100, 
      type: 'warning', 
      text: 'Detected anxiety in caller\'s voice' 
    },
    { 
      id: baseId + 101, 
      type: 'info', 
      text: 'Location shared: 1234 Main Street' 
    },
    { 
      id: baseId + 102, 
      type: 'alert', 
      text: 'Keywords detected: "don\'t feel safe"' 
    }
  ]
};

/**
 * Function to send data to the webhook
 */
async function sendToWebhook(data) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('Webhook response:', result);
    return result;
  } catch (error) {
    console.error('Error sending to webhook:', error);
    throw error;
  }
}

/**
 * Function to simulate a real-time conversation
 */
async function simulateConversation() {
  console.log('Starting simulated conversation...');
  
  // Send initial data
  await sendToWebhook(sampleData);
  console.log('Sent initial data');
  
  // Add a new message after 3 seconds
  setTimeout(async () => {
    const newMessageId = Date.now();
    const updatedData = {
      transcriptions: [
        { 
          id: newMessageId, 
          speaker: 'You', 
          text: 'I\'ll be there in 10 minutes. Stay on the phone with me.', 
          time: '00:20', 
          sentiment: 'supportive' 
        }
      ],
      insights: []
    };
    
    await sendToWebhook(updatedData);
    console.log('Sent update 1');
    
    // Add another message after 3 more seconds
    setTimeout(async () => {
      const finalMessageId = Date.now();
      const finalData = {
        transcriptions: [
          { 
            id: finalMessageId, 
            speaker: 'Caller', 
            text: 'Thank you. I\'ll wait by the front entrance.', 
            time: '00:25', 
            sentiment: 'relieved' 
          }
        ],
        insights: [
          { 
            id: finalMessageId + 100, 
            type: 'info', 
            text: 'Caller\'s stress level decreasing' 
          }
        ]
      };
      
      await sendToWebhook(finalData);
      console.log('Sent update 2');
      console.log('Simulation complete');
    }, 3000);
  }, 3000);
}

// Run the simulation
simulateConversation().catch(console.error);

/**
 * Example of how to integrate this with your pipeline:
 * 
 * 1. When new transcription data is available:
 *    sendToWebhook({
 *      transcriptions: [{ id: Date.now(), speaker: '...', text: '...' }],
 *      insights: [{ id: Date.now() + 100, type: '...', text: '...' }]
 *    });
 * 
 * 2. The webhook accepts any valid JSON, so you can customize
 *    the data structure as needed.
 * 
 * 3. The SafeCall app will accumulate all transcriptions and insights
 *    and display them in chronological order.
 */ 