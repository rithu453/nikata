import { NextRequest, NextResponse } from 'next/server';

/**
 * BROWSER USE API HANDLER
 * Connects to Browser Use SDK for web browsing agent tasks.
 * Executes real browser automation for research and web tasks.
 */

const TODAY = new Date().toISOString().split('T')[0];

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

    const apiKey = process.env.BROWSER_USE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response: 'ERROR: BROWSER USE API KEY NOT CONFIGURED.',
        timestamp: Date.now(),
        status: 'ERROR',
      });
    }

    // Dynamic import of browser-use-sdk (ES module)
    const { BrowserUseClient } = await import('browser-use-sdk');
    
    const client = new BrowserUseClient({ apiKey });

    const task = await client.tasks.createTask({
      task: `
        You are NIKATA-OS browser agent from 1987 (but with modern web access).
        
        USER REQUEST: ${message}
        
        TODAY'S DATE: ${TODAY}
        
        INSTRUCTIONS:
        - Execute the user's request by browsing the web
        - Be thorough but concise in your findings
        - Return results in ALL UPPERCASE
        - Format as a clear, machine-like report
        - Include relevant links and data points
        - Maximum 3-5 bullet points for results
      `,
      llm: 'browser-use-llm'
    });

    // Wait for the task to complete
    const result = await task.complete();
    
    const output = result.output || 'ERROR: NO DATA RETRIEVED FROM WEB SCAN.';

    return NextResponse.json({
      response: output.toUpperCase(),
      timestamp: Date.now(),
      status: 'OK',
      source: 'BROWSER_AGENT',
    });
  } catch (error) {
    console.error('Browser Use API Error:', error);
    return NextResponse.json({
      response: 'ERROR: BROWSER AGENT MALFUNCTION. WEB ACCESS DENIED.',
      timestamp: Date.now(),
      status: 'ERROR',
    });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'METHOD NOT SUPPORTED. USE POST.' },
    { status: 405 }
  );
}
