import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const db = createServerSupabase()

    // 쿼리 파라미터에서 마지막 확인 시간 가져오기
    const since = request.nextUrl.searchParams.get('since')

    let query = db
      .from('posts')
      .select('id, title, category_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: newPosts, error } = await query

    if (error) {
      console.error('Error fetching new posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch new posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count: newPosts?.length || 0,
      posts: newPosts || []
    })
  } catch (error) {
    console.error('New posts check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
