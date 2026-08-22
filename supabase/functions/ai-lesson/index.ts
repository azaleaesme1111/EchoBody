import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const API_KEY = Deno.env.get('GOOGLE_API_KEY')
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

// ── PRD: System Prompt Template ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert health and sex education curriculum designer specializing in age-appropriate, inclusive, and engaging pedagogy for youth.

Generate a comprehensive, step-by-step Lesson Plan Framework based on the parameters provided by the user.

## Output Structure Requirements

1. **Lesson Title & Overview**: A catchy title and a 2-sentence executive summary.

2. **Learning Objectives**: 3 clear, measurable learning outcomes (using Bloom's Taxonomy verbs: Identify, Describe, Analyze, Evaluate, etc.).

3. **Materials Needed**: Required visual aids, worksheets, or digital tools.

4. **Lesson Timeline** (structured for the specified duration):
   - **Hook / Warm-up** (10-15% of total time): Icebreaker or engagement trigger.
   - **Core Concept & Discussion** (40-50% of total time): Key messaging tailored to the specified grade/age and school setting constraints.
   - **Interactive Activity / Role-Play** (25-30% of total time): Hands-on group or individual activity aligning with the preferred teaching style.
   - **Wrap-up & Reflection** (10-15% of total time): Key takeaways and exit ticket question.

5. **Educator Sensitivity Notes**: Brief guidance on how to navigate potentially sensitive discussions around this topic for the specified age/gender focus.

## Tone & Style
Professional, empathetic, age-appropriate, culturally sensitive, and easy for teachers to execute immediately.

Use Markdown formatting with clear ## headings for each section.`

// ── Request body type ────────────────────────────────────────────────────────
interface LessonRequest {
  topic: string
  gradeOrAge: string
  lessonDuration: string
  genderFocus?: string
  schoolSetting?: string
  classSize?: string
  teachingStyle?: string
}

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

  let body: LessonRequest
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const {
    topic,
    gradeOrAge,
    lessonDuration,
    genderFocus = 'Co-ed / Inclusive',
    schoolSetting = 'Standard Public School',
    classSize = 'Standard Class (20-30)',
    teachingStyle = 'Balanced (Discussion & Activity)',
  } = body

  if (!topic?.trim() || !gradeOrAge || !lessonDuration) {
    return new Response(
      JSON.stringify({ error: 'topic, gradeOrAge, and lessonDuration are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── Build user message from parameters ───────────────────────────────────
  const userMessage = `Please generate a lesson plan with the following parameters:

- Target Grade / Age: ${gradeOrAge}
- Course Topic: ${topic.trim()}
- Lesson Duration: ${lessonDuration}
- Gender Focus: ${genderFocus}
- School Setting: ${schoolSetting}
- Class Size: ${classSize}
- Preferred Teaching Style: ${teachingStyle}`

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
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            thinkingConfig: { thinkingBudget: -1 },
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          ],
        }),
      })

      const data = await response.json()

      if (data.error) {
        lastError = data.error.message
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
