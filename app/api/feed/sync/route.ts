import { NextRequest, NextResponse } from 'next/server'
import { syncNewsFeed } from '@/lib/feed-sync'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 간단한 보안: API 키 확인 (선택사항)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.FEED_SYNC_SECRET || 'dev-secret'}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await syncNewsFeed()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Feed sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await syncNewsFeed()
    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Feed sync error:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
