import Link from 'next/link'

export default function ViewerLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-emerald-950">
      {/* 상단 네비게이션 */}
      <nav className="bg-emerald-900 border-b border-emerald-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/viewer" className="text-white font-bold text-lg hover:text-emerald-300 transition">
            📱 커뮤니티 허브
          </Link>
          <div className="flex gap-6">
            <Link
              href="/admin"
              className="text-emerald-300 hover:text-white transition text-sm"
            >
              🔧 관리자
            </Link>
            <a
              href="/api/auth/logout"
              className="text-red-400 hover:text-red-300 transition text-sm"
            >
              로그아웃
            </a>
          </div>
        </div>
      </nav>

      {children}
    </div>
  )
}
