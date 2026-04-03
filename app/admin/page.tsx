export default function AdminPage() {
  return (
    <div className="min-h-screen bg-emerald-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔧 관리자 대시보드</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 게시물 관리 */}
          <div className="bg-emerald-900 rounded-lg p-6 border border-emerald-800">
            <h2 className="text-xl font-bold text-white mb-3">📝 게시물 관리</h2>
            <p className="text-emerald-300 mb-4">게시물을 추가하고 관리합니다</p>
            <a
              href="/admin/posts"
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition"
            >
              게시물 관리 →
            </a>
          </div>

          {/* 카테고리 관리 */}
          <div className="bg-emerald-900 rounded-lg p-6 border border-emerald-800">
            <h2 className="text-xl font-bold text-white mb-3">🏷️ 카테고리 관리</h2>
            <p className="text-emerald-300 mb-4">카테고리를 추가하고 관리합니다</p>
            <a
              href="/admin/categories"
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition"
            >
              카테고리 관리 →
            </a>
          </div>
        </div>

        {/* 안내 */}
        <div className="mt-8 bg-emerald-800/30 border border-emerald-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-2">📌 안내사항</h3>
          <ul className="text-emerald-300 space-y-2">
            <li>• 새로운 게시물을 추가할 수 있습니다</li>
            <li>• 카테고리를 추가하고 관리할 수 있습니다</li>
            <li>• 기존 게시물을 수정하고 삭제할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
