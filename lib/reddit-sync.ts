import { createServerSupabase } from './supabase-server'
import { translateToKorean } from './translator'

const REDDIT_SUBREDDITS = {
  homeschool: 'homeschool',
  learnprogramming: 'learnprogramming',
  korea: 'korea',
  theology: 'theology',
  Christianity: 'Christianity',
  education: 'education'
}

const CATEGORY_KEYWORDS = {
  ai: ['AI', 'machine learning', 'deep learning', 'ChatGPT', 'algorithm'],
  homeschool: ['homeschool', 'homeschooling', 'education', 'learning', 'student'],
  christian: ['Christianity', 'church', 'faith', 'gospel', 'prayer'],
  theology: ['theology', 'biblical', 'scripture', 'faith', 'religion']
}

async function getRedditPosts(subreddit: string, limit: number = 50) {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          'User-Agent': 'community-hub-app/1.0 (Python:requests:2.28.1)'
        }
      }
    )

    if (!response.ok) {
      console.error(`❌ Reddit API 오류 [${subreddit}]: ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.data.children.map((post: any) => ({
      title: post.data.title,
      description: post.data.selftext?.substring(0, 500) || post.data.url,
      content: post.data.selftext || '',
      author: post.data.author,
      source_url: `https://reddit.com${post.data.permalink}`,
      created_at: new Date(post.data.created_utc * 1000)
    }))
  } catch (error) {
    console.error(`❌ Reddit 파싱 오류 [${subreddit}]:`, error)
    return []
  }
}

function scorePostForCategories(
  title: string,
  description: string
): Record<string, number> {
  const scores = {
    ai: 0,
    general: 5,
    homeschool: 0,
    christian: 0,
    theology: 0
  }

  const text = (title + ' ' + description).toLowerCase()

  // AI 점수
  if (['ai', 'machine learning', 'deep learning', 'chatgpt', 'algorithm', 'python', 'tensorflow'].some(k => text.includes(k))) {
    scores.ai = Math.min(10, 5 + Math.floor(Math.random() * 5))
  }

  // 홈스쿨 점수
  if (['homeschool', 'education', 'learning', 'student', 'teach'].some(k => text.includes(k))) {
    scores.homeschool = Math.min(10, 6 + Math.floor(Math.random() * 4))
  }

  // 기독교 점수
  if (['church', 'faith', 'prayer', 'gospel', 'christian'].some(k => text.includes(k))) {
    scores.christian = Math.min(10, 7 + Math.floor(Math.random() * 3))
  }

  // 신학 점수
  if (['theology', 'biblical', 'scripture', 'religion', 'spiritual'].some(k => text.includes(k))) {
    scores.theology = Math.min(10, 7 + Math.floor(Math.random() * 3))
  }

  return scores
}

export async function syncRedditPosts() {
  try {
    console.log('🔴 Reddit 포스트 동기화 시작...')

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

    // 각 서브레딧 처리
    for (const [name, subreddit] of Object.entries(REDDIT_SUBREDDITS)) {
      try {
        console.log(`\n🔗 [${subreddit.toUpperCase()}] Reddit 포스트 가져오는 중...`)
        const posts = await getRedditPosts(subreddit, 30)
        console.log(`📥 ${posts.length}개의 포스트 발견`)

        for (const post of posts) {
          try {
            // 중복 확인
            const { data: existing } = await db
              .from('posts')
              .select('id')
              .eq('source_url', post.source_url)
              .single()

            if (existing) {
              totalSkipped++
              continue
            }

            // 카테고리 점수 매기기
            const scores = scorePostForCategories(post.title, post.description)

            // 한글로 번역 (영문 제목만)
            let translatedTitle = post.title
            let translatedDescription = post.description

            // 영문이 포함된 경우만 번역
            const hasEnglish = /[a-zA-Z]/.test(post.title)
            if (hasEnglish) {
              console.log(`🌍 번역 중: ${post.title.substring(0, 40)}...`)
              const translated = await translateToKorean(
                post.title.substring(0, 255),
                post.description.substring(0, 500)
              )
              translatedTitle = translated.title
              translatedDescription = translated.description
              console.log(`✅ 번역됨: ${translatedTitle.substring(0, 40)}...`)
            }

            // 각 카테고리에 저장 (점수가 충분하면)
            for (const [category, score] of Object.entries(scores)) {
              if (score >= 4 && categoryMap[category]) {
                const { error } = await db.from('posts').insert([
                  {
                    category_id: categoryMap[category],
                    title: `🇬🇧 ${translatedTitle.substring(0, 250)}`,
                    description: translatedDescription.substring(0, 500),
                    content: post.content.substring(0, 5000),
                    author: post.author || 'Reddit',
                    source_url: post.source_url,
                    thumbnail_url: null,
                    views: 0,
                    likes: 0
                  }
                ])

                if (!error) {
                  console.log(`✅ [${category}] 저장됨: ${translatedTitle.substring(0, 50)}...`)
                  totalSaved++
                }
              }
            }
          } catch (error) {
            console.error(`❌ 포스트 처리 실패:`, error)
            totalSkipped++
          }
        }
      } catch (error) {
        console.error(`❌ [${subreddit}] 오류:`, error)
      }
    }

    console.log(`\n✅ Reddit 동기화 완료! (저장: ${totalSaved}, 스킵: ${totalSkipped})`)
    return { success: true, savedCount: totalSaved, skippedCount: totalSkipped }
  } catch (error) {
    console.error('❌ Reddit 동기화 오류:', error)
    return { success: false, error: String(error) }
  }
}
