import Parser from 'rss-parser'
import { createServerSupabase } from './supabase-server'

const parser = new Parser()

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

        // 최신 3개 항목만 처리 (여러 소스이므로 개수 줄임)
        const items = feed.items?.slice(0, 3) || []

        if (items.length === 0) {
          console.log(`⚠️  [${source}] 피드에 항목이 없습니다`)
          continue
        }

        let savedCount = 0
        let skippedCount = 0

        for (const item of items) {
          try {
            if (!item.link || !item.title) {
              console.log(`⏭️  [${source}] 필수 정보 없음: ${item.title}`)
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
                category_id: newsCategory.id,
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
              console.error(`❌ [${source}] 저장 실패: ${item.title}`)
              skippedCount++
            } else {
              console.log(`✅ [${source}] 저장됨: ${item.title}`)
              savedCount++
            }
          } catch (itemError) {
            console.error(`❌ [${source}] 항목 처리 실패:`, itemError)
            skippedCount++
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
