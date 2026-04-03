import cron from 'node-cron'
import { syncNewsFeed } from './feed-sync'
import { syncRedditPosts } from './reddit-sync'
import { syncDevToArticles } from './devto-sync'
import { syncYouTubeVideos } from './youtube-sync'

let scheduledTask: any = null

async function runAllSyncs() {
  console.log('\n🚀 종합 콘텐츠 동기화 시작...\n')

  try {
    // 1. RSS 뉴스 피드
    console.log('========== RSS 뉴스 피드 ==========')
    await syncNewsFeed()

    // 2. Reddit 커뮤니티
    console.log('\n========== Reddit 커뮤니티 ==========')
    await syncRedditPosts()

    // 3. Dev.to 기술 글
    console.log('\n========== Dev.to 기술 글 ==========')
    await syncDevToArticles()

    // 4. YouTube 교육 영상
    console.log('\n========== YouTube 교육 영상 ==========')
    await syncYouTubeVideos()

    console.log('\n✅ 모든 콘텐츠 동기화 완료!\n')
  } catch (error) {
    console.error('❌ 동기화 오류:', error)
  }
}

export function startFeedScheduler() {
  try {
    // 매 30분마다 실행 (더 자주 콘텐츠 업데이트)
    scheduledTask = cron.schedule('*/30 * * * *', async () => {
      console.log('⏰ 자동 콘텐츠 동기화 시작...')
      await runAllSyncs()
    })

    console.log('✅ 종합 콘텐츠 동기화 스케줄러 시작됨 (매 30분)')

    // 서버 시작 시 첫 번째 동기화 실행
    console.log('🔄 초기 동기화 실행 중...')
    runAllSyncs()
  } catch (error) {
    console.error('❌ 스케줄러 시작 실패:', error)
  }
}

export function stopFeedScheduler() {
  if (scheduledTask) {
    scheduledTask.stop()
    scheduledTask = null
    console.log('⏹️ 피드 자동 동기화 스케줄러 중지됨')
  }
}
