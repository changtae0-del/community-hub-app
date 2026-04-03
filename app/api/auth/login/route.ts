import { NextRequest, NextResponse } from 'next/server'
import { signRoleCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { role, password } = await request.json()

    // 기본 유효성 검사
    if (!role || !['viewer', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      )
    }

    // JWT 토큰 생성 및 쿠키 설정
    const response = NextResponse.json({
      success: true,
      role
    })

    const cookie = await signRoleCookie(role as 'admin' | 'viewer')
    response.cookies.set('gk_role', cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
