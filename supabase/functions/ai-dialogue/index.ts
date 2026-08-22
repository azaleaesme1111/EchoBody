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

  let body: { nodeDialogue: string; speakerTag: string; intent: string; userText: string; prompt: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { nodeDialogue, speakerTag, intent, userText, prompt: systemPrompt } = body

  if (!nodeDialogue || !userText) {
    return new Response(JSON.stringify({ error: 'nodeDialogue and userText are required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

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
            { role: 'user',   content: `NPC: ${nodeDialogue}\n\nUser: ${userText}\n\nYour response as ${speakerTag || 'the NPC'}:` },
          ],
          temperature: 0.8,
          max_tokens: 300,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'Groq API error')

      const text = data.choices?.[0]?.message?.content
      if (!text) throw new Error('Empty response from Groq')

      return new Response(JSON.stringify({ content: text }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (e: any) {
      lastError = e.message
      if (e.message?.toLowerCase().includes('rate') || e.message?.toLowerCase().includes('quota') || e.status === 429) continue
      break
    }
  }

  return new Response(JSON.stringify({ error: lastError ?? 'Dialogue generation failed' }), {
    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
