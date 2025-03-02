import { NextResponse } from 'next/server';

// In-memory store for the latest transcription data
// Note: This will reset on each deployment or server restart
// For production, consider using a database, Redis, or Vercel KV
let latestData = {
  transcriptions: [],
  insights: []
};

// Maximum number of items to keep in memory
const MAX_ITEMS = 100;

/**
 * Simple webhook endpoint to receive JSON data from external pipeline
 */
export async function POST(request) {
  try {
    // Parse the incoming JSON request
    const data = await request.json();
    
    // Accumulate transcriptions, avoiding duplicates by ID
    if (data.transcriptions && data.transcriptions.length > 0) {
      // Get existing IDs for deduplication
      const existingTranscriptionIds = new Set(latestData.transcriptions.map(t => t.id));
      
      // Add only new transcriptions
      data.transcriptions.forEach(transcription => {
        // If it's a partial update of an existing transcription, replace it
        if (transcription.is_partial) {
          const existingIndex = latestData.transcriptions.findIndex(
            t => t.call_sid === transcription.call_sid && t.speaker === transcription.speaker && t.is_partial
          );
          
          if (existingIndex >= 0) {
            latestData.transcriptions[existingIndex] = transcription;
            return;
          }
        }
        
        // Otherwise add as new if ID doesn't exist
        if (!existingTranscriptionIds.has(transcription.id)) {
          latestData.transcriptions.push(transcription);
        }
      });
      
      // Sort by ID to maintain chronological order
      latestData.transcriptions.sort((a, b) => a.id - b.id);
      
      // Limit the number of items to prevent memory issues
      if (latestData.transcriptions.length > MAX_ITEMS) {
        latestData.transcriptions = latestData.transcriptions.slice(-MAX_ITEMS);
      }
    }
    
    // Accumulate insights, avoiding duplicates by ID
    if (data.insights && data.insights.length > 0) {
      // Get existing IDs for deduplication
      const existingInsightIds = new Set(latestData.insights.map(i => i.id));
      
      // Add only new insights
      data.insights.forEach(insight => {
        if (!existingInsightIds.has(insight.id)) {
          // Add emergency flag to insights with notify_police action
          if (insight.type === "emergency" && insight.action === "notify_police") {
            insight.emergency = true;
            console.log("🚨 EMERGENCY INSIGHT RECEIVED:", insight);
          }
          latestData.insights.push(insight);
        }
      });
      
      // Sort by ID to maintain chronological order
      latestData.insights.sort((a, b) => a.id - b.id);
      
      // Limit the number of items to prevent memory issues
      if (latestData.insights.length > MAX_ITEMS) {
        latestData.insights = latestData.insights.slice(-MAX_ITEMS);
      }
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Data received and accumulated successfully',
      timestamp: new Date().toISOString(),
      counts: {
        transcriptions: latestData.transcriptions.length,
        insights: latestData.insights.length
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error processing webhook data:', error);
    return NextResponse.json(
      { error: 'Failed to process data' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// GET endpoint to retrieve the latest data
export async function GET() {
  return NextResponse.json(latestData, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
} 