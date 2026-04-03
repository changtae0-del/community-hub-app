import { createServerSupabase } from './supabase-server'
import Parser from 'rss-parser'

const parser = new Parser()

// 교육/학습 관련 YouTube 채널 (RSS 피드)
const YOUTUBE_CHANNELS = {
  // 홈스쿨/교육
  homeschool_mom: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJFp8uSYCjXOMnkUyb3CQ3A', // 예시
  
  // AI/기술
  andrew_ng: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCPg3u7kXLvR4ePIceVnSEZQ', // DeepLearning.AI
  
  // 일반 교육
  khan_academy: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC4JX40jDee_NI8pnyzcmZSA', // Khan Academy
  
  // 기술
  computerphile: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC9-y-6csu5mg-rbJ7_TcBmA', // Computerphile
}

async function getYouTubeVideos(channelRssUrl: string, limit: number = 10) {
  try {
    const feed = await parser.parseURL(channelRssUrl)
    
    return (feed.items?.slice(0, limit) || []).map(item => ({
      title: item.title || 'No title',
      description: item.contentSnippet || item.summary || '',
      content: item.content || '',
      author: item.creator || item.author || 'YouTube',
      source_url: item.link || '',
      thumbnail_url: (item as any)['media:thumbnail']?.[0]?.$ ?.url || null,
      published_at: item.pubDate || new Date().toISOString()
    }))
  } catch (error) {
    console.error(`❌ YouTube RSS 파싱 오류:`, error)
    return []
  }
}

function scoreVideoForCategories(
  title: string,
  description: string
): Record<string, number> {
  const scores = {
    ai: 0,
    general: 3,
    homeschool: 0,
    christian: 0,
    theology: 0
  }

  const text = (title + ' ' + description).toLowerCase()

  // AI 점수
  if (['ai', 'machine learning', 'deep learning', 'neural', 'algorithm', 'programming'].some(k => text.includes(k))) {
    scores.ai = Math.min(10, 7 + Math.floor(Math.random() * 3))
  }

  // 홈스쿨/교육 점수
  if (['education', 'learning', 'lesson', 'tutorial', 'teach', 'homeschool', 'student'].some(k => text.includes(k))) {
    scores.homeschool = Math.min(10, 7 + Math.floor(Math.random() * 3))
  }

  // 일반 점수 (영상 콘텐츠는 항상 값어치가 있음)
  scores.general = 5

  return scores
}

export async function syncYouTubeVideos() {
  try {
    console.log('🎥 YouTube 영상 동기화 시작...')

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

    // 각 채널 처리
    for (const [channelName, rssUrl] of Object.entries(YOUTUBE_CHANNELS)) {
      try {
        console.log(`\n🔗 [${channelName.toUpperCase()}] YouTube 영상 가져오는 중...`)
        const videos = await getYouTubeVideos(rssUrl, 10)
        console.log(`📥 ${videos.length}개의 영상 발견`)

        for (const video of videos) {
          try {
            // 중복 확인
            const { data: existing } = await db
              .from('posts')
              .select('id')
              .eq('source_url', video.source_url)
              .single()

            if (existing) {
              totalSkipped++
              continue
            }

            // 카테고리 점수 매기기
            const scores = scoreVideoForCategories(video.title, video.description)

            // 각 카테고리에 저장 (점수가 충분하면)
            for (const [category, score] of Object.entries(scores)) {
              if (score >= 3 && categoryMap[category]) {
                const { error } = await db.from('posts').insert([
                  {
                    category_id: categoryMap[category],
                    title: `🎥 ${video.title.substring(0, 250)}`,
                    description: video.description.substring(0, 500),
                    content: video.content.substring(0, 2000),
                    author: video.author || 'YouTube',
                    source_url: video.source_url,
                    thumbnail_url: video.thumbnail_url,
                    views: 0,
                    likes: 0
                  }
                ])

                if (!error) {
                  console.log(`✅ [${category}] 저장됨: ${video.title.substring(0, 50)}...`)
                  totalSaved++
                }
              }
            }
          } catch (error) {
            console.error(`❌ 영상 처리 실패:`, error)
            totalSkipped++
          }
        }
      } catch (error) {
        console.error(`❌ [${channelName}] 오류:`, error)
      }
    }

    console.log(`\n✅ YouTube 동기화 완료! (저장: ${totalSaved}, 스킵: ${totalSkipped})`)
    return { success: true, savedCount: totalSaved, skippedCount: totalSkipped }
  } catch (error) {
    console.error('❌ YouTube 동기화 오류:', error)
    return { success: false, error: String(error) }
  }
}
