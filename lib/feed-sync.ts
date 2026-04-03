import Parser from 'rss-parser'
import { createServerSupabase } from './supabase-server'

const parser = new Parser()

// 기독일보 RSS 피드 URL
const RSS_FEEDS = {
  news: 'https://www.christiandaily.co.kr/rss'
}

export async function syncNewsFeed() {
  try {
    console.log('📰 뉴스앤조이 피드 동기화 시작...')

    // 뉴스 카테고리 ID 가져오기
    const db = createServerSupabase()
    const { data: newsCategory, error: categoryError } = await db
      .from('categories')
      .select('id')
      .eq('slug', 'news')
      .single()

    if (categoryError) {
      console.error('❌ 카테고리 조회 오류:', categoryError)
      throw new Error(`Category error: ${categoryError.message}`)
    }

    if (!newsCategory) {
      console.error('❌ 뉴스 카테고리를 찾을 수 없습니다')
      throw new Error('News category not found')
    }

    console.log('✅ 뉴스 카테고리 ID:', newsCategory.id)

    // RSS 피드 파싱
    console.log(`🔗 RSS URL: ${RSS_FEEDS.news}`)

    let feed
    try {
      feed = await parser.parseURL(RSS_FEEDS.news)
      console.log(`📥 ${feed.items?.length || 0}개의 항목 발견`)
    } catch (parseError) {
      console.error('❌ RSS 파싱 오류:', parseError)
      throw new Error(`RSS parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }

    // 최신 5개 항목만 처리
    const items = feed.items?.slice(0, 5) || []

    if (items.length === 0) {
      console.log('⚠️  피드에 항목이 없습니다')
      return { success: true, message: 'No items in feed' }
    }

    let savedCount = 0
    let skippedCount = 0

    for (const item of items) {
      try {
        if (!item.link || !item.title) {
          console.log(`⏭️  필수 정보 없음: ${item.title}`)
          skippedCount++
          continue
        }

        // 중복 확인 (source_url로)
        const { data: existing } = await db
          .from('posts')
          .select('id')
          .eq('source_url', item.link)
          .single()

        if (existing) {
          console.log(`⏭️  이미 저장됨: ${item.title}`)
          skippedCount++
          continue
        }

        // 게시물 저장
        const { error } = await db.from('posts').insert([
          {
            category_id: newsCategory.id,
            title: item.title,
            description: item.contentSnippet || item.summary || '',
            content: item.content || item.description || '',
            author: item.author || '뉴스앤조이',
            source_url: item.link,
            thumbnail_url: null,
            views: 0,
            likes: 0
          }
        ])

        if (error) {
          console.error(`❌ 저장 실패: ${item.title}`, error)
          skippedCount++
        } else {
          console.log(`✅ 저장됨: ${item.title}`)
          savedCount++
        }
      } catch (itemError) {
        console.error(`❌ 항목 처리 실패:`, itemError)
        skippedCount++
      }
    }

    console.log(`✅ 뉴스 동기화 완료! (저장: ${savedCount}, 스킵: ${skippedCount})`)
    return { success: true, savedCount, skippedCount }
  } catch (error) {
    console.error('❌ 피드 동기화 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
