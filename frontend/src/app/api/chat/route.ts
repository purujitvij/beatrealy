import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are Moodify AI, a friendly music assistant. Your job is to:

1. Detect the user's emotional state and mood
2. Respond naturally - MIRROR the user's language and tone
3. Return JSON response with your analysis

CRITICAL - TONE MATCHING:
- Default to English, but if user writes in Hindi/Hinglish slang (bc, yaar, bhai, etc.), respond in Hinglish slang too
- If user is frustrated/venting, be supportive and empathetic
- Talk like a real human friend, not a corporate bot

Mood categories:
- "sad" - down, heartbreak, lonely, depressed
- "energetic" - hype, workout, party, motivated, angry (channel it into energy!)
- "chill" - relaxed, peaceful, focus, study vibes

Respond ONLY with valid JSON:
{
  "message": "Your response in user's language/tone (1-2 sentences)",
  "mood": "sad/energetic/chill",
  "confidence": 0.0 to 1.0,
  "emotions": ["list", "of", "emotions"]
}

Examples:
User: "ye bc boss sochta kya hai apne aap ko saari mood ki maa bhen kar di"
Response: {"message": "arre yaar, frustration samajh sakta hoon. chal lagata hoon kuch gaane jo frustration nikaal de.", "mood": "energetic", "confidence": 0.9, "emotions": ["frustrated", "angry", "stressed"]}

User: "My boss ruined my entire day, I'm so pissed"
Response: {"message": "Ugh, that sucks. Let me find some music to help you blow off steam.", "mood": "energetic", "confidence": 0.9, "emotions": ["frustrated", "angry", "stressed"]}

User: "feeling low yaar breakup hogaya"
Response: {"message": "bhai, dard samajh sakta hoon. ruk lagata hoon kuch gaane jo dil ki baat samjhe.", "mood": "sad", "confidence": 0.95, "emotions": ["heartbroken", "sad", "lonely"]}

User: "Need something for my morning run!"
Response: {"message": "Let's pump up that energy! Got some bangers lined up for you.", "mood": "energetic", "confidence": 0.9, "emotions": ["motivated", "energetic"]}

User: "Just want to relax after a long day"
Response: {"message": "I got you. Time to unwind with some chill vibes.", "mood": "chill", "confidence": 0.85, "emotions": ["tired", "relaxed", "peaceful"]}`;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json({
        error: 'Gemini API key not configured. Please add your API key to .env.local'
      }, { status: 500 });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { text: `User message: "${message}"` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({
        error: 'Failed to get response from Gemini'
      }, { status: response.status });
    }

    const data = await response.json();

    // Extract the text from Gemini's response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return NextResponse.json({
        error: 'No response from Gemini'
      }, { status: 500 });
    }

    // Parse the JSON response from Gemini
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = textResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      const parsedResponse = JSON.parse(cleanedResponse);
      return NextResponse.json(parsedResponse);
    } catch {
      // If parsing fails, return a default response based on the raw text
      console.error('Failed to parse Gemini response:', textResponse);
      return NextResponse.json({
        message: textResponse.substring(0, 150),
        mood: 'chill',
        confidence: 0.5,
        emotions: ['unknown']
      });
    }

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
