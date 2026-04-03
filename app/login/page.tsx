'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'viewer' | 'admin'>('viewer')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || '로그인 실패')
        return
      }

      // 로그인 성공
      router.push(role === 'admin' ? '/admin' : '/viewer')
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📱 커뮤니티 허브</h1>
          <p className="text-emerald-200">다양한 커뮤니티를 한 곳에서</p>
        </div>

        {/* 로그인 폼 */}
        <form
          onSubmit={handleLogin}
          className="bg-emerald-900 rounded-2xl p-8 border border-emerald-800 shadow-lg space-y-6"
        >
          {/* 역할 선택 */}
          <div>
            <label className="block text-emerald-100 text-sm font-medium mb-3">역할</label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded-lg bg-emerald-800 cursor-pointer hover:bg-emerald-700 transition">
                <input
                  type="radio"
                  name="role"
                  value="viewer"
                  checked={role === 'viewer'}
                  onChange={(e) => setRole(e.target.value as 'viewer')}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-white">뷰어 (게시물 보기)</span>
              </label>
              <label className="flex items-center p-3 rounded-lg bg-emerald-800 cursor-pointer hover:bg-emerald-700 transition">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value as 'admin')}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-white">관리자 (게시물 관리)</span>
              </label>
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-emerald-100 text-sm font-medium mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-2 bg-emerald-800 text-white rounded-lg border border-emerald-700 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-emerald-300 mt-1">테스트: 비밀번호는 아무거나 입력해도 됩니다</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 text-white font-bold py-3 rounded-lg transition disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 안내 */}
        <div className="mt-6 text-center text-emerald-300 text-sm">
          <p>테스트 계정으로 로그인해 주세요</p>
        </div>
      </div>
    </div>
  )
}
