import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const API_KEY = Deno.env.get('GOOGLE_API_KEY')
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

// ── System Prompts ───────────────────────────────────────────────────────────

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

const REFINE_PROMPT = `You are an expert curriculum specialist helping teachers refine their lesson plans.

The teacher has an existing lesson plan and wants to make specific adjustments. Carefully incorporate their feedback while maintaining:
- Age-appropriateness
- Pedagogical soundness
- Clear structure and timing
- Cultural sensitivity

Return the COMPLETE updated lesson plan in the same Markdown format. Do not omit any sections. Only modify what the teacher requested — keep everything else intact.`

const SLIDES_PROMPT = `You are a presentation designer converting lesson plans into high-quality slide decks.

Convert the given lesson plan into a JSON array of slides. Each slide should have:
- "title": concise, max 8 words
- "bullets": array of 2-5 short bullet points (each under 15 words)
- "notes": optional speaker notes (1-2 sentences)

Rules:
- First slide is always the title slide (title = lesson title, bullets = 2-3 key themes/keywords)
- Include one slide for Learning Objectives
- Include one slide for Materials Needed
- Break the Lesson Timeline into separate slides (Hook, Core, Activity, Wrap-up)
- Include one final slide for Key Takeaways / Reflection
- Total: 6-10 slides
- Keep text minimal and visual-friendly (max 100 words per slide)

Return ONLY valid JSON in this exact format, no markdown code blocks:
[{"title":"...","bullets":["..."],"notes":"..."}]`

// ── Types ────────────────────────────────────────────────────────────────────

interface LessonRequest {
  action?: 'generate' | 'refine' | 'slides'
  topic?: string
  gradeOrAge?: string
  lessonDuration?: string
  genderFocus?: string
  schoolSetting?: string
  classSize?: string
  teachingStyle?: string
  currentPlan?: string
  feedback?: string
  lessonPlan?: string
}

// ── Gemini API call helper ───────────────────────────────────────────────────

async function callGemini(
  systemInstruction: string,
  userMessage: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<{ content?: string; error?: string }> {
  if (!API_KEY) return { error: 'Google API key not configured' }

  const maxRetries = 4
  let lastError: string | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 4000 * attempt))

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: opts?.temperature ?? 0.7,
            maxOutputTokens: opts?.maxTokens ?? 8192,
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
        if (data.error.code === 429 || lastError?.includes('quota') || lastError?.includes('rate')) continue
        return { error: lastError }
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return { content: text }
    } catch (e: any) {
      lastError = e.message
    }
  }

  return { error: lastError || 'Rate limited. Please wait a moment and try again.' }
}

// ── Action Handlers ──────────────────────────────────────────────────────────

function handleGenerate(body: LessonRequest) {
  const { topic, gradeOrAge, lessonDuration, genderFocus, schoolSetting, classSize, teachingStyle } = body
  if (!topic?.trim() || !gradeOrAge || !lessonDuration) {
    return { status: 400, body: { error: 'topic, gradeOrAge, and lessonDuration are required' } }
  }

  const userMessage = `Please generate a lesson plan with the following parameters:

- Target Grade / Age: ${gradeOrAge}
- Course Topic: ${topic.trim()}
- Lesson Duration: ${lessonDuration}
- Gender Focus: ${genderFocus || 'Co-ed / Inclusive'}
- School Setting: ${schoolSetting || 'Standard Public School'}
- Class Size: ${classSize || 'Standard Class (20-30)'}
- Preferred Teaching Style: ${teachingStyle || 'Balanced (Discussion & Activity)'}`

  return { userMessage, system: SYSTEM_PROMPT }
}

function handleRefine(body: LessonRequest) {
  const { currentPlan, feedback } = body
  if (!currentPlan?.trim() || !feedback?.trim()) {
    return { status: 400, body: { error: 'currentPlan and feedback are required' } }
  }

  const userMessage = `Here is the current lesson plan:

${currentPlan}

---

Teacher's refinement request: ${feedback}

Please return the complete updated lesson plan incorporating the changes above.`

  return { userMessage, system: REFINE_PROMPT }
}

function handleSlides(body: LessonRequest) {
  const { lessonPlan } = body
  if (!lessonPlan?.trim()) {
    return { status: 400, body: { error: 'lessonPlan is required' } }
  }

  const userMessage = `Convert the following lesson plan into presentation slides:

${lessonPlan}`

  return { userMessage, system: SLIDES_PROMPT, isJson: true, maxTokens: 4096 }
}

// ── Main Serve ───────────────────────────────────────────────────────────────

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  }

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  let body: LessonRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const action = body.action || 'generate'
  let result: any

  if (action === 'generate') result = handleGenerate(body)
  else if (action === 'refine') result = handleRefine(body)
  else if (action === 'slides') result = handleSlides(body)
  else return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  // If handler returned an error status
  if (result?.status) {
    return new Response(JSON.stringify(result.body), { status: result.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { userMessage, system, isJson, maxTokens } = result
  const geminiResult = await callGemini(system, userMessage, { maxTokens })

  if (geminiResult.error) {
    return new Response(JSON.stringify({ error: geminiResult.error }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let content = geminiResult.content!

  // For slides action, try to parse JSON from response
  if (isJson) {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const slides = JSON.parse(jsonMatch[0])
        return new Response(JSON.stringify({ slides }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    } catch {
      // fall through to return raw content
    }
    return new Response(JSON.stringify({ error: 'Failed to parse slides JSON', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ content }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
