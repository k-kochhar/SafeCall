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
    
    // Store the latest data
    if (data.transcriptions) {
      latestData.transcriptions = data.transcriptions;
    }
    
    if (data.insights) {
      latestData.insights = data.insights;
    }
    
    // Log the received data
    console.log('Webhook received data:', data);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Data received successfully',
      timestamp: new Date().toISOString()
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