import { NextResponse } from 'next/server';

// In-memory store for the latest transcription data
// In a production app, you might use a database or Redis
let latestData = {
  transcriptions: [],
  insights: []
};

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
        if (!existingTranscriptionIds.has(transcription.id)) {
          latestData.transcriptions.push(transcription);
        }
      });
      
      // Sort by ID to maintain chronological order
      latestData.transcriptions.sort((a, b) => a.id - b.id);
    }
    
    // Accumulate insights, avoiding duplicates by ID
    if (data.insights && data.insights.length > 0) {
      // Get existing IDs for deduplication
      const existingInsightIds = new Set(latestData.insights.map(i => i.id));
      
      // Add only new insights
      data.insights.forEach(insight => {
        if (!existingInsightIds.has(insight.id)) {
          latestData.insights.push(insight);
        }
      });
      
      // Sort by ID to maintain chronological order
      latestData.insights.sort((a, b) => a.id - b.id);
    }
    
    // Log the received data and current state
    console.log('Webhook received data:', data);
    console.log('Current accumulated data:', {
      transcriptionsCount: latestData.transcriptions.length,
      insightsCount: latestData.insights.length
    });
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Data received and accumulated successfully',
      timestamp: new Date().toISOString(),
      counts: {
        transcriptions: latestData.transcriptions.length,
        insights: latestData.insights.length
      }
    });
  } catch (error) {
    console.error('Error processing webhook data:', error);
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve the latest data
export async function GET() {
  return NextResponse.json(latestData);
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