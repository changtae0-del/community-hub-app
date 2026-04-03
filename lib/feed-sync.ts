import Parser from 'rss-parser'
import { createServerSupabase } from './supabase-server'
import OpenAI from 'openai'

const parser = new Parser()

// OpenAI 클라이언트는 필요할 때만 생성 (build time에 필수 아님)
let openai: OpenAI | null = null

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openai
}

// 카테고리 초기화 (없으면 생성)
async function initializeCategories(db: any) {
  console.log('📁 카테고리 초기화 중...')

  for (const config of CATEGORIES_CONFIG) {
    const { data: existing } = await db
      .from('categories')
      .select('id')
      .eq('slug', config.slug)
      .single()

    if (!existing) {
      const { error } = await db
        .from('categories')
        .insert([{
          name: config.name,
          slug: config.slug,
          icon: config.icon,
          color_hex: config.color,
          description: `${config.name} - AI 필터링으로 자동 수집`
        }])

      if (error) {
        console.error(`❌ 카테고리 생성 실패 [${config.slug}]:`, error)
      } else {
        console.log(`✅ 카테고리 생성 [${config.slug}]: ${config.name}`)
      }
    }
  }
}

// AI로 뉴스를 각 카테고리별로 평가 (1-10점)
async function analyzeNewsForCategories(title: string, description: string): Promise<Record<string, number>> {
  try {
    const client = getOpenAIClient()
    if (!client) {
      console.warn('⚠️ OpenAI API 키가 없습니다. 기본 점수 사용')
      return { ai: 5, general: 5, homeschool: 5, christian: 5, theology: 5 }
    }

    const keywordsList = Object.entries(CATEGORY_KEYWORDS)
      .map(([cat, keywords]) => `${cat}: ${keywords.join(', ')}`)
      .join('\n')

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `다음 뉴스를 5개 카테고리에 대해 각각 1-10점으로 평가해주세요.

뉴스 제목: ${title}
뉴스 설명: ${description}

평가 대상 카테고리와 키워드:
${keywordsList}

각 카테고리마다 관련성 점수를 숫자로만 답변해주세요.
형식: ai,general,homeschool,christian,theology
예: 8,4,2,6,9`
        }
      ],
      temperature: 0.3,
      max_tokens: 20
    })

    const scoreText = response.choices[0].message.content?.trim() || '5,5,5,5,5'
    const scores = scoreText.split(',').map((s) => Math.max(1, Math.min(10, parseInt(s) || 5)))

    return {
      ai: scores[0] || 5,
      general: scores[1] || 5,
      homeschool: scores[2] || 5,
      christian: scores[3] || 5,
      theology: scores[4] || 5
    }
  } catch (error) {
    console.error('⚠️ AI 분석 오류:', error)
    return { ai: 5, general: 5, homeschool: 5, christian: 5, theology: 5 }
  }
}

// 카테고리별 필터링 키워드
const CATEGORY_KEYWORDS = {
  ai: ['AI', '인공지능', 'ChatGPT', '머신러닝', '딥러닝', '자동화', '알고리즘', '빅데이터', '데이터분석', '디지털혁신'],
  general: ['정책', '경제', '사회', '문화', '과학', '기술', '국제', '스포츠', '연예', '시사'],
  homeschool: ['교육', '홈스쿨', '학교', '학습', '수학', '과학', '영어', '독서', '진로', '대학입시'],
  christian: ['교회', '기독교', '목사', '설교', '예배', '신앙', '구원', '은혜', '신앙생활', '기독교문화'],
  theology: ['신학', '성경', '말씀', '교리', '기독교사상', '성서해석', '신학교', '목회', '신앙성장', '영성']
}

// 카테고리 정보
const CATEGORIES_CONFIG = [
  { name: 'AI관련 최신뉴스', slug: 'ai', icon: '🤖', color: '#3b82f6' },
  { name: '일반최신뉴스 종합', slug: 'general', icon: '📰', color: '#ef4444' },
  { name: '홈스쿨 관련 최신뉴스', slug: 'homeschool', icon: '🎓', color: '#8b5cf6' },
  { name: '개신교계 뉴스', slug: 'christian', icon: '⛪', color: '#f59e0b' },
  { name: '신학공부 관련 뉴스', slug: 'theology', icon: '📖', color: '#10b981' }
]

// 주요 뉴스 사이트 RSS 피드 URL
const RSS_FEEDS = {
  sbs: 'https://news.sbs.co.kr/news/rss.do',
  ytn: 'https://www.ytn.co.kr/_rss/',
  news1: 'https://news1.kr/rss/',
  christiandaily: 'https://www.christiandaily.co.kr/rss'
}

export async function syncNewsFeed() {
  try {
    console.log('📰 뉴스 피드 동기화 시작...')

    const db = createServerSupabase()

    // 카테고리 초기화
    await initializeCategories(db)

    // 모든 카테고리 조회
    const { data: categories, error: categoriesError } = await db
      .from('categories')
      .select('id, slug')
      .in('slug', ['ai', 'general', 'homeschool', 'christian', 'theology'])

    if (categoriesError || !categories || categories.length === 0) {
      console.error('❌ 카테고리 조회 오류')
      throw new Error('Categories not found')
    }

    const categoryMap = Object.fromEntries(
      categories.map(cat => [cat.slug, cat.id])
    )

    console.log('✅ 카테고리 로드 완료:', Object.keys(categoryMap).join(', '))

    let totalSavedCount = 0
    let totalSkippedCount = 0

    // 모든 RSS 피드 처리
    for (const [source, feedUrl] of Object.entries(RSS_FEEDS)) {
      try {
        console.log(`\n🔗 [${source.toUpperCase()}] RSS URL: ${feedUrl}`)

        let feed
        try {
          feed = await parser.parseURL(feedUrl)
          console.log(`📥 ${feed.items?.length || 0}개의 항목 발견`)
        } catch (parseError) {
          console.error(`❌ [${source}] RSS 파싱 오류:`, parseError)
          continue // 다음 피드로 진행
        }

        // 최신 10개 항목 가져오기 (AI로 점수 매기고 상위만 선택)
        const rawItems = feed.items?.slice(0, 10) || []

        if (rawItems.length === 0) {
          console.log(`⚠️  [${source}] 피드에 항목이 없습니다`)
          continue
        }

        // AI로 카테고리별 중요도 분석
        console.log(`🤖 [${source}] AI 분석 시작...`)
        const itemsWithScores = await Promise.all(
          rawItems.map(async (item) => {
            const scores = await analyzeNewsForCategories(
              item.title || '',
              item.contentSnippet || item.summary || ''
            )
            return { item, scores }
          })
        )

        // 각 카테고리별로 상위 5개 뉴스 수집
        const itemsByCategory: Record<string, Array<{ item: any, score: number }>> = {
          ai: [], general: [], homeschool: [], christian: [], theology: []
        }

        for (const { item, scores } of itemsWithScores) {
          for (const [category, score] of Object.entries(scores)) {
            if (itemsByCategory[category]) {
              itemsByCategory[category].push({ item, score })
            }
          }
        }

        // 각 카테고리별로 상위 5개만 선택
        const categoriesWithTopItems: Record<string, Array<{ item: any, score: number }>> = {}
        for (const [category, items] of Object.entries(itemsByCategory)) {
          categoriesWithTopItems[category] = items
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
        }

        let savedCount = 0
        let skippedCount = 0

        // 각 카테고리별로 상위 항목들을 데이터베이스에 저장
        for (const [category, items] of Object.entries(categoriesWithTopItems)) {
          for (const { item, score } of items) {
            try {
              if (!item.link || !item.title) {
                console.log(`⏭️  [${source}] [${category}] 필수 정보 없음`)
                skippedCount++
                continue
              }

              // 중복 확인
              const { data: existing } = await db
                .from('posts')
                .select('id')
                .eq('source_url', item.link)
                .single()

              if (existing) {
                skippedCount++
                continue
              }

              // 게시물 저장
              const { error } = await db.from('posts').insert([
                {
                  category_id: categoryMap[category],
                  title: item.title,
                  description: item.contentSnippet || item.summary || '',
                  content: item.content || item.description || '',
                  author: item.author || source,
                  source_url: item.link,
                  thumbnail_url: null,
                  views: 0,
                  likes: 0
                }
              ])

              if (error) {
                console.error(`❌ [${source}] [${category}] 저장 실패: ${item.title}`)
                skippedCount++
              } else {
                console.log(`✅ [${source}] [${category}] 저장됨 (점수: ${score}/10): ${item.title}`)
                savedCount++
              }
            } catch (itemError) {
              console.error(`❌ [${source}] [${category}] 항목 처리 실패:`, itemError)
              skippedCount++
            }
          }
        }

        console.log(`✅ [${source}] 완료! (저장: ${savedCount}, 스킵: ${skippedCount})`)
        totalSavedCount += savedCount
        totalSkippedCount += skippedCount
      } catch (sourceError) {
        console.error(`❌ [${source}] 소스 처리 오류:`, sourceError)
      }
    }

    console.log(`\n📊 전체 뉴스 동기화 완료! (저장: ${totalSavedCount}, 스킵: ${totalSkippedCount})`)
    return { success: true, savedCount: totalSavedCount, skippedCount: totalSkippedCount }
  } catch (error) {
    console.error('❌ 피드 동기화 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
