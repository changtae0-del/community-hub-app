import { NextRequest, NextResponse } from 'next/server'
import { syncNewsFeed } from '@/lib/feed-sync'
import { syncRedditPosts } from '@/lib/reddit-sync'
import { syncDevToArticles } from '@/lib/devto-sync'
import { syncYouTubeVideos } from '@/lib/youtube-sync'

export const dynamic = 'force-dynamic'

async function runAllSyncs() {
  const results = []

  console.log('\n🚀 종합 콘텐츠 동기화 시작...\n')

  try {
    console.log('========== RSS 뉴스 피드 ==========')
    const rssResult = await syncNewsFeed()
    results.push({ type: 'RSS 뉴스', ...rssResult })
  } catch (error) {
    results.push({ type: 'RSS 뉴스', error: String(error) })
  }

  try {
    console.log('\n========== Reddit 커뮤니티 ==========')
    const redditResult = await syncRedditPosts()
    results.push({ type: 'Reddit', ...redditResult })
  } catch (error) {
    results.push({ type: 'Reddit', error: String(error) })
  }

  try {
    console.log('\n========== Dev.to 기술 글 ==========')
    const devtoResult = await syncDevToArticles()
    results.push({ type: 'Dev.to', ...devtoResult })
  } catch (error) {
    results.push({ type: 'Dev.to', error: String(error) })
  }

  try {
    console.log('\n========== YouTube 교육 영상 ==========')
    const youtubeResult = await syncYouTubeVideos()
    results.push({ type: 'YouTube', ...youtubeResult })
  } catch (error) {
    results.push({ type: 'YouTube', error: String(error) })
  }

  console.log('\n✅ 모든 콘텐츠 동기화 완료!\n')

  return results
}

export async function POST(request: NextRequest) {
  try {
    const results = await runAllSyncs()
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Content sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const results = await runAllSyncs()
    return NextResponse.json({ success: true, results })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Content sync error:', errorMessage)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
