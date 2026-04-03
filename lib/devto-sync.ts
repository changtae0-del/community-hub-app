import { createServerSupabase } from './supabase-server'

const DEVTO_TAGS = [
  'ai', 'machine-learning', 'learning', 'education', 
  'tutorial', 'programming', 'technology', 'javascript', 'python'
]

interface DevToArticle {
  id: number
  title: string
  description: string
  body_markdown: string
  url: string
  author: {
    name: string
  }
  published_at: string
  reading_time_minutes: number
}

async function getDevToArticles(tag: string, limit: number = 20) {
  try {
    const response = await fetch(
      `https://dev.to/api/articles?tag=${tag}&per_page=${limit}`
    )

    if (!response.ok) {
      console.error(`❌ Dev.to API 오류 [${tag}]: ${response.status}`)
      return []
    }

    const articles: DevToArticle[] = await response.json()
    return articles.map(article => ({
      title: article.title,
      description: article.description || article.body_markdown.substring(0, 300),
      content: article.body_markdown.substring(0, 3000),
      author: article.author.name,
      source_url: article.url,
      published_at: article.published_at
    }))
  } catch (error) {
    console.error(`❌ Dev.to 파싱 오류 [${tag}]:`, error)
    return []
  }
}

function scorePostForCategories(
  title: string,
  description: string,
  tag: string
): Record<string, number> {
  const scores = {
    ai: 0,
    general: 5,
    homeschool: 0,
    christian: 0,
    theology: 0
  }

  const text = (title + ' ' + description + ' ' + tag).toLowerCase()

  // AI/ML 점수
  if (['ai', 'machine learning', 'deep learning', 'neural', 'algorithm', 'python', 'tensorflow'].some(k => text.includes(k))) {
    scores.ai = Math.min(10, 8 + Math.floor(Math.random() * 2))
  } else if (['programming', 'javascript', 'tutorial', 'code'].some(k => text.includes(k))) {
    scores.ai = Math.min(10, 5 + Math.floor(Math.random() * 3))
  }

  // 학습 점수
  if (['learning', 'education', 'tutorial', 'guide', 'beginners'].some(k => text.includes(k))) {
    scores.homeschool = Math.min(10, 6 + Math.floor(Math.random() * 4))
  }

  // 일반 뉴스 점수는 자동으로 5 (기술 기사는 일반 카테고리에도 속함)

  return scores
}

export async function syncDevToArticles() {
  try {
    console.log('📝 Dev.to 기사 동기화 시작...')

    const db = createServerSupabase()

    // 카테고리 맵 가져오기
    const { data: categories, error: catError } = await db
      .from('categories')
      .select('id, slug')

    if (catError || !categories) {
      console.error('❌ 카테고리 조회 실패')
      return { success: false, savedCount: 0, skippedCount: 0 }
    }

    const categoryMap = Object.fromEntries(
      categories.map(cat => [cat.slug, cat.id])
    )

    let totalSaved = 0
    let totalSkipped = 0

    // 각 태그별 기사 처리
    for (const tag of DEVTO_TAGS) {
      try {
        console.log(`\n🔗 [${tag.toUpperCase()}] Dev.to 기사 가져오는 중...`)
        const articles = await getDevToArticles(tag, 15)
        console.log(`📥 ${articles.length}개의 기사 발견`)

        for (const article of articles) {
          try {
            // 중복 확인
            const { data: existing } = await db
              .from('posts')
              .select('id')
              .eq('source_url', article.source_url)
              .single()

            if (existing) {
              totalSkipped++
              continue
            }

            // 카테고리 점수 매기기
            const scores = scorePostForCategories(
              article.title,
              article.description,
              tag
            )

            // 각 카테고리에 저장 (점수가 충분하면)
            for (const [category, score] of Object.entries(scores)) {
              if (score >= 4 && categoryMap[category]) {
                const { error } = await db.from('posts').insert([
                  {
                    category_id: categoryMap[category],
                    title: article.title.substring(0, 255),
                    description: article.description.substring(0, 500),
                    content: article.content.substring(0, 5000),
                    author: article.author || 'Dev.to',
                    source_url: article.source_url,
                    thumbnail_url: null,
                    views: 0,
                    likes: 0
                  }
                ])

                if (!error) {
                  console.log(`✅ [${category}] 저장됨: ${article.title.substring(0, 50)}...`)
                  totalSaved++
                }
              }
            }
          } catch (error) {
            console.error(`❌ 기사 처리 실패:`, error)
            totalSkipped++
          }
        }
      } catch (error) {
        console.error(`❌ [${tag}] 오류:`, error)
      }
    }

    console.log(`\n✅ Dev.to 동기화 완료! (저장: ${totalSaved}, 스킵: ${totalSkipped})`)
    return { success: true, savedCount: totalSaved, skippedCount: totalSkipped }
  } catch (error) {
    console.error('❌ Dev.to 동기화 오류:', error)
    return { success: false, error: String(error) }
  }
}
