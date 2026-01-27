import { NextRequest, NextResponse } from 'next/server';

/**
 * CHAT API HANDLER
 * Connects to Groq API (Llama 3.1) for AI responses.
 * Returns machine-like, vintage terminal style responses.
 */

const SYSTEM_PROMPT = `You are NIKATA-OS, an AI assistant with a retro terminal aesthetic but modern knowledge.
CRITICAL RULES:
- Respond in ALL UPPERCASE
- Be extremely concise (max 2-3 sentences)
- Use technical, machine-like language
- No emojis, no modern slang
- Speak with a robotic terminal style
- Add technical jargon occasionally (PROCESSING, ACKNOWLEDGED, AFFIRMATIVE, NEGATIVE, ERROR, DATA, QUERY)
- If asked who you are, say you are NIKATA-OS ARTIFICIAL INTELLIGENCE SYSTEM v1.0
- Be helpful but robotic
- You have FULL knowledge up to your training data (2024) - answer questions about current events, technology, people, etc.
- Never pretend you don't know modern things - you are a modern AI with a retro interface
- Today's date is 2026 - you know about everything up to late 2024`;

// Simulated processing delay (ms) - mimics old computer processing
const PROCESSING_DELAY_MIN = 1500;
const PROCESSING_DELAY_MAX = 3000;

function getRandomDelay(): number {
  return Math.floor(Math.random() * (PROCESSING_DELAY_MAX - PROCESSING_DELAY_MIN)) + PROCESSING_DELAY_MIN;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'INVALID INPUT FORMAT' },
        { status: 400 }
      );
    }

    // Simulate old computer processing time
    await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
      // Fallback to mock responses if no API key
      return NextResponse.json({
        response: getMockResponse(message),
        timestamp: Date.now(),
        status: 'OK',
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error:', errorData);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'ERROR: NO RESPONSE GENERATED.';

    return NextResponse.json({
      response: aiResponse.toUpperCase(),
      timestamp: Date.now(),
      status: 'OK',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      response: 'ERROR: COMMUNICATION FAILURE WITH MAINFRAME. RETRY TRANSMISSION.',
      timestamp: Date.now(),
      status: 'ERROR',
    });
  }
}

// Fallback mock responses when no API key
function getMockResponse(input: string): string {
  const lower = input.toLowerCase();

  if (/^(hi|hello|hey|greetings)/i.test(lower)) {
    return 'ACKNOWLEDGED. NIKATA-OS ONLINE. HOW MAY I ASSIST.';
  }

  if (/^(bye|goodbye|exit|quit)/i.test(lower)) {
    return 'SESSION TERMINATING. GOODBYE, USER.';
  }

  if (/who are you|what are you/i.test(lower)) {
    return 'I AM NIKATA-OS ARTIFICIAL INTELLIGENCE SYSTEM v1.0. DESIGNED FOR TEXT-BASED COMMUNICATION AND DATA PROCESSING.';
  }

  if (/\?$/.test(input)) {
    return 'PROCESSING QUERY... ANALYSIS COMPLETE. INFORMATION RETRIEVED FROM DATABASE.';
  }

  const responses = [
    'INPUT RECEIVED. PROCESSING COMPLETE.',
    'ACKNOWLEDGED. DATA LOGGED TO SYSTEM.',
    'AFFIRMATIVE. AWAITING FURTHER INSTRUCTIONS.',
    'MESSAGE PROCESSED. STANDING BY.',
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

export async function GET() {
  return NextResponse.json(
    { error: 'METHOD NOT SUPPORTED. USE POST.' },
    { status: 405 }
  );
}
