import cron from 'node-cron'
import { syncNewsFeed } from './feed-sync'

let scheduledTask: cron.ScheduledTask | null = null

export function startFeedScheduler() {
  try {
    // 매 시간 정각에 실행 (예: 1:00, 2:00, 3:00...)
    scheduledTask = cron.schedule('0 * * * *', async () => {
      console.log('⏰ 자동 피드 동기화 시작...')
      try {
        await syncNewsFeed()
      } catch (error) {
        console.error('❌ 자동 동기화 오류:', error)
      }
    })

    console.log('✅ 피드 자동 동기화 스케줄러 시작됨 (매 시간)')
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
