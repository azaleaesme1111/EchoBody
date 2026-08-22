import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const API_KEY = Deno.env.get('GOOGLE_API_KEY')
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Google API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let body: { topic: string; ageGroup: string }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body. Expected { topic, ageGroup }' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { topic, ageGroup } = body

  if (!topic?.trim() || !ageGroup) {
    return new Response(
      JSON.stringify({ error: 'topic and ageGroup are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const prompt = `Design a sex ed lesson plan for "${topic.trim()}" (age: ${ageGroup}) in English.

## Topic
[topic]

## Target Age Group
[age group]

## Learning Objectives
1. [obj1]
2. [obj2]
3. [obj3]

## Materials Needed
- [mat1]
- [mat2]
- [mat3]

## Lesson Flow
### 1. Introduction (5 min)
[activity]
### 2. Core Teaching (15 min)
[content]
### 3. Interactive Activity (15 min)
[activity]
### 4. Discussion (10 min)
[discussion]
### 5. Summary (5 min)
[summary]

## Key Teaching Notes
[tips]`

  const maxRetries = 4
  let lastError: string | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 4000 * attempt))
    }

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: -1 },
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      })

      const data = await response.json()

      if (data.error) {
        lastError = data.error.message
        // Check for rate limiting
        if (data.error.code === 429 || lastError?.includes('quota') || lastError?.includes('rate')) {
          continue
        }
        return new Response(
          JSON.stringify({ error: lastError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        return new Response(
          JSON.stringify({ content: text }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e: any) {
      lastError = e.message
    }
  }

  return new Response(
    JSON.stringify({ error: lastError || 'Rate limited. Please wait a moment and try again.' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
