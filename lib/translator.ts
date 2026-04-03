import OpenAI from 'openai'

let openai: OpenAI | null = null

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openai
}

export async function translateToKorean(
  title: string,
  description: string
): Promise<{ title: string; description: string }> {
  try {
    const client = getOpenAIClient()
    if (!client) {
      console.warn('⚠️ OpenAI API 키 없음 - 번역 건너뜀')
      return { title, description }
    }

    // 제목과 설명을 함께 번역 (한 번의 API 호출로 비용 절감)
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `다음 영문을 자연스러운 한국어로 번역해주세요. 정확성과 자연스러움을 우선으로 해주세요.

제목: ${title}

설명: ${description}

응답 형식:
제목: [한글 제목]
설명: [한글 설명]`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const translatedText = response.choices[0].message.content || ''

    // 응답 파싱 (줄 단위로 처리)
    let translatedTitle = title
    let translatedDescription = description

    const lines = translatedText.split('\n')
    for (const line of lines) {
      if (line.includes('제목:')) {
        translatedTitle = line.replace(/제목:\s*/, '').trim()
      } else if (line.includes('설명:')) {
        translatedDescription = line.replace(/설명:\s*/, '').trim()
      }
    }

    return {
      title: translatedTitle || title,
      description: translatedDescription || description
    }
  } catch (error) {
    console.error('❌ 번역 오류:', error)
    // 오류 발생 시 원문 반환
    return { title, description }
  }
}

export async function translateBatch(
  items: Array<{ title: string; description: string }>
): Promise<Array<{ title: string; description: string }>> {
  const results = []

  for (const item of items) {
    const translated = await translateToKorean(item.title, item.description)
    results.push(translated)
    
    // API 레이트 제한 회피를 위해 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}
