import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let body: { scenarioId: string; userMessage: string; npcMessage: string; round: number }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { scenarioId, userMessage, npcMessage, round } = body

  if (!scenarioId || !userMessage || !npcMessage) {
    return new Response(JSON.stringify({ error: 'scenarioId, userMessage and npcMessage are required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const systemPrompt = `You are helping a user in an educational role-play game about personal boundaries and consent.
Given the current situation, generate exactly TWO suggested responses the user could send next.
Both should be natural, age-appropriate replies that move the conversation forward.
Return ONLY a JSON object like: {"suggestions": ["option 1", "option 2"]}`

  let lastError: string | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt))
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Scenario: ${scenarioId}\nRound: ${round}\n\nYou just said: "${npcMessage}"\nThe user said: "${userMessage}"\n\nSuggest 2 things the user could reply next.` },
          ],
          temperature: 0.8,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'Groq API error')

      const text = data.choices?.[0]?.message?.content
      if (!text) throw new Error('Empty response')

      return new Response(JSON.stringify({ content: text }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (e: any) {
      lastError = e.message
      if (e.message?.toLowerCase().includes('rate') || e.message?.toLowerCase().includes('quota') || e.status === 429) continue
      break
    }
  }

  return new Response(JSON.stringify({ error: lastError ?? 'Suggestion failed' }), {
    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
