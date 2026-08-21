# AI Lesson Edge Function 部署步骤

## 1. 打开 Supabase Dashboard
访问: https://supabase.com/dashboard/project/ibbyuaabgtlemgfortyt/functions

## 2. 创建 ai-lesson 函数
1. 点击 **"New function"**
2. 名称填入: `ai-lesson`
3. 把下面代码完整粘贴进去

## 3. 写入函数代码
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const DEEPSEEK_API_BASE = Deno.env.get('DEEPSEEK_API_BASE') || 'https://api-gateway.openagents.org/v1'
const DEEPSEEK_MODEL = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-4-flash'
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
        model: DEEPSEEK_MODEL,
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
```

## 4. 配置环境变量（必须！）
1. 在函数列表点击 `ai-lesson`
2. 进入 **"Settings"** 或 **"Environment"** 标签
3. 添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `DEEPSEEK_API_KEY` | `sk-demo-X7ZlRXQO-WiMOlg7x4PDOngIK6qhIvResklXsGYO30w` |

> `DEEPSEEK_API_BASE` 和 `DEEPSEEK_MODEL` 有默认值，不用配。

## 5. 部署
点击 **"Deploy"** 按钮。

## 6. 测试
部署完成后，在浏览器打开应用，进入课程页面，选择年龄段输入主题，点 Generate。

如果还有问题，检查浏览器控制台 Network 面板里 `/functions/v1/ai-lesson` 这个请求的 Response 内容。
