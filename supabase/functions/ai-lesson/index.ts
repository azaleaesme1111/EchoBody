import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const DEEPSEEK_API_BASE = Deno.env.get('DEEPSEEK_API_BASE') || 'https://api.deepseek.com'
const DEEPSEEK_API_URL = `${DEEPSEEK_API_BASE}/chat/completions`

const SYSTEM_PROMPT = `You are an expert sex education curriculum designer for schools.
Your task is to design a structured lesson plan framework in English, based on the topic and age group provided.
Follow this exact format for your response (use Markdown):

## Topic
[The lesson topic]

## Target Age Group
[Elementary / Middle School / High School]

## Learning Objectives
1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

## Materials Needed
- [Material 1]
- [Material 2]
- [Material 3]

## Lesson Flow

### 1. Introduction (5 minutes)
[Description of the introduction activity]

### 2. Core Teaching (15 minutes)
[Description of the main teaching content]

### 3. Interactive Activity (15 minutes)
[Description of the interactive activity]

### 4. Discussion & Sharing (10 minutes)
[Description of the discussion activity]

### 5. Summary & Homework (5 minutes)
[Description of the summary]

## Key Teaching Notes
[Tips for educators on how to handle sensitive topics]

Keep the content age-appropriate, professional, and practical for classroom use.`

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (!DEEPSEEK_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'DeepSeek API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let body: { topic: string; ageGroup: string }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
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

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Topic: ${topic.trim()}\nAge Group: ${ageGroup}` },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return new Response(
        JSON.stringify({ error: data.error.message || 'DeepSeek API error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const content = data.choices?.[0]?.message?.content

    return new Response(
      JSON.stringify({ content }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message || 'Failed to generate lesson plan' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
