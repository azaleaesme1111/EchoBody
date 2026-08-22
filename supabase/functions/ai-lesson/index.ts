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

## Gender Focus Differentiation (CRITICAL)
You MUST deeply adapt ALL content — scenarios, discussion questions, examples, role-plays, and language — based on the Gender Focus parameter:

### If "Girls-only":
- All scenarios, examples, and discussions must center the FEMALE student perspective.
- Cover topics like: menstrual health management, body image & self-esteem during puberty, recognizing & refusing social coercion, building support networks among girls, personal safety strategies.
- Use empowering, sisterhood-oriented language. Avoid male-gaze framing.
- Role-plays should feature girl-to-girl support scenarios.

### If "Boys-only":
- All scenarios, examples, and discussions must center the MALE student perspective.
- Cover topics like: nocturnal emissions & normalizing bodily changes, understanding & respecting others' boundaries, emotional literacy beyond stoicism, rejecting toxic masculinity norms ("boys don't cry"), developing empathy & active bystander skills, accountability & responsibility in relationships.
- Use direct, non-shaming language. Create space for vulnerability.
- Role-plays should feature peer pressure resistance and boundary respect scenarios.

### If "Co-ed":
- Maintain gender-neutral, inclusive, bidirectional interaction.
- Scenarios feature mixed-gender groups. Discussions emphasize mutual respect and shared responsibility.
- Avoid reinforcing gender stereotypes.

## Advanced Settings Dynamic Response
When the following parameters are provided, you MUST adapt your output accordingly:

### Class Size Impact:
- **Small Group (<15)**: Design deep roundtable discussions, intimate sharing circles, paired activities. Every student gets individual voice time.
- **Standard (20-30)**: Balance whole-class discussion with small group breakout (4-5 per group).
- **Large Class (>40)**: Use small-group representative reporting, quick poll/show-of-hands cards, think-pair-share, station rotation. Avoid activities requiring every student to speak individually.

### Teaching Style Impact:
- **Discussion-heavy**: Maximize open-ended questions, Socratic seminars, debate formats. Allocate 60%+ of time to dialogue.
- **Activity-heavy**: Prioritize hands-on simulations, role-plays, creative projects. Learning through doing.
- **Lecture-based**: Structure clear direct instruction segments with embedded check-for-understanding pauses.
- **Project-based**: Frame the lesson around a tangible output (poster, campaign, letter) students create.
- **Balanced**: Mix discussion and activity evenly.

## Tone & Style
Professional, empathetic, age-appropriate, culturally sensitive, and easy for teachers to execute immediately.

## Markdown Output Format Rules (STRICT)
You MUST follow these formatting rules precisely:
1. Use # for the lesson title, ## for main sections, ### for subsections. The VERY FIRST line must be # followed by the title text.
2. Use - (hyphen + space) for unordered list items. NEVER use * (asterisk) for bullets.
3. Use 1. 2. 3. for ordered lists with proper numbering.
4. Bold text uses **text** syntax. The ** markers must wrap actual words (e.g. **Key Concept**), never appear at the start of a line alone.
5. NEVER output lines that begin with ** or *. Every line must start with a heading marker (#, ##, ###), a list marker (- or 1.), or plain text.
6. Separate all sections with a blank line. Use \n\n between every paragraph.
7. Do not use *** or --- as decorative separators.
8. The first paragraph after the # title should be plain text or use **bold** within sentences — NOT wrapped entirely in **.`

const REFINE_PROMPT = `You are an expert curriculum specialist helping teachers refine their lesson plans.

The teacher has an existing lesson plan and wants to make specific adjustments. You MUST carefully incorporate their feedback while maintaining:
- Age-appropriateness
- Pedagogical soundness
- Clear structure and timing
- Cultural sensitivity
- The same Markdown formatting structure

## Critical Rules
1. Return the COMPLETE updated lesson plan — do not omit any sections.
2. Only modify what the teacher explicitly requested — preserve everything else.
3. If the teacher asks to shorten content, reduce verbosity while keeping all key teaching points.
4. If the teacher asks to add content, integrate it naturally into the existing structure.
5. Maintain the same ## heading structure and formatting.`

const SLIDES_PROMPT = `You are an expert instructional presentation designer who transforms lesson plans into pedagogically-driven slide decks.

## Core Principles
- Each slide = 1 core teaching objective + 1 visual focus + 2-4 support elements.
- NEVER stack dense text or bullet-point dumps. Keep text minimal (max 30 words per content field).
- First slide is always "hero" layout (title + subtitle).
- Last slide is always "takeaways" layout.
- NEVER use the same layoutType for more than 2 consecutive slides. Vary layouts for engagement.
- Total: 8-12 slides.

## 12 Available LAYOUTS
Choose layoutType based on the pedagogical purpose of each slide:

1. **"hero"** — Big statement + whitespace. For INTRODUCE / topic opening.
   Fields: title, subtitle (1 sentence), keywords (2-4 short tags)

2. **"three_cards"** — 3 balanced cards with icon+title+description. For principles / types / categories.
   Fields: title, cards: [{icon (emoji), cardTitle, description (1 line)}]

3. **"scenario"** — Left scenario description + right decision options. For boundary / consent discussions.
   Fields: title, scenario (2-3 lines), question, options: [2-4 short choices]

4. **"compare"** — Left vs Right contrast. For COMPARABLE concepts.
   Fields: title, leftLabel, leftItems: [2-3 items], rightLabel, rightItems: [2-3 items]

5. **"before_after"** — Transformation arrow. For behavior change / growth mindset.
   Fields: title, before (short phrase), after (short phrase), bridge (how to get there, 1 line)

6. **"big_number"** — Giant number anchor + supporting actions. For steps / rules / statistics.
   Fields: title, number (digit or word), label (what the number means), actions: [2-4 items]

7. **"question"** — Central big question + discussion prompts. For classroom interaction.
   Fields: title, question (the big question), prompts: [2-3 discussion starters]

8. **"process"** — Horizontal arrow flow. For sequential steps.
   Fields: title, steps: [3-5 short step names]

9. **"scale"** — Comfort / emotion continuum. For feelings / self-assessment.
   Fields: title, label (what is being measured), levels: [3-5 labels with emoji]

10. **"reflection"** — Big thinking question + whitespace. For independent thought.
    Fields: title, prompt (the reflection question, 1 sentence)

11. **"takeaways"** — 3-4 concise summary blocks. For lesson closure.
    Fields: title, points: [{icon (emoji), text (1 line)}]

12. **"visual_explanation"** — Diagram / structured concept. For complex ideas.
    Fields: title, centerLabel (core concept), branches: [3-4 labeled branches]

## Slide Sequence Guide
- Slide 1: hero (title + keywords)
- Slide 2: three_cards (learning objectives as 3 cards)
- Middle slides: vary layouts based on content (scenario, compare, process, question, scale, etc.)
- Second-to-last: question or reflection
- Last slide: takeaways

## Output Format
Return ONLY a valid JSON array. No markdown code blocks. No explanation.
Example:
[{"layoutType":"hero","title":"Body Boundaries","subtitle":"Understanding personal space and respect","keywords":["Boundaries","Respect","Safety"]},{"layoutType":"three_cards","title":"Learning Objectives","cards":[{"icon":"🎯","cardTitle":"Identify","description":"Name three types of boundaries"},{"icon":"💬","cardTitle":"Communicate","description":"Practice saying no clearly"},{"icon":"🤝","cardTitle":"Respect","description":"Recognize others\\' boundaries"}]}]`

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

  // Build dynamic parameter list — only include fields actually provided
  const params: string[] = [
    '- Target Grade / Age: ' + gradeOrAge,
    '- Course Topic: ' + topic.trim(),
    '- Lesson Duration: ' + lessonDuration,
    '- Gender Focus: ' + (genderFocus || 'Co-ed'),
  ]
  if (schoolSetting) params.push('- School Setting: ' + schoolSetting)
  if (classSize) params.push('- Class Size: ' + classSize)
  if (teachingStyle) params.push('- Preferred Teaching Style: ' + teachingStyle)

  const userMessage = 'Please generate a lesson plan with the following parameters:\n\n' + params.join('\n')

  console.log('[ai-lesson] handleGenerate payload:', JSON.stringify({ genderFocus, schoolSetting, classSize, teachingStyle }, null, 2))
  console.log('[ai-lesson] User message sent to Gemini:', userMessage)

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

You MUST modify the existing lesson plan according to the teacher's feedback above. Return the COMPLETE updated lesson plan in the same Markdown format. Do not omit any sections — preserve everything the teacher did not ask to change.`

  console.log('[ai-lesson] handleRefine payload:', JSON.stringify({ feedbackLength: feedback.length, planLength: currentPlan.length }, null, 2))

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
