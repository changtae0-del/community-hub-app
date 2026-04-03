import { notFound } from 'next/navigation'
import { Post } from '@/types'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getPost(id: string): Promise<Post | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/posts/${id}`,
      { cache: 'no-store' }
    )

    if (!response.ok) return null
    return response.json()
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return null
  }
}

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const post = await getPost(postId)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-emerald-950">
      {/* 뒤로가기 버튼 */}
      <div className="bg-emerald-900 border-b border-emerald-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/viewer"
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
          >
            ← 돌아가기
          </Link>
        </div>
      </div>

      {/* 게시물 상세 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <article className="bg-emerald-900 rounded-xl p-6 border border-emerald-800">
          {/* 카테고리 */}
          {post.category && (
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: post.category.color_hex || '#10b981' }}
              ></span>
              <span className="text-sm text-emerald-300">{post.category.name}</span>
            </div>
          )}

          {/* 제목 */}
          <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>

          {/* 메타 정보 */}
          <div className="flex items-center justify-between text-sm text-emerald-400 pb-6 border-b border-emerald-800 mb-6">
            <div className="space-y-1">
              {post.author && <p>작성자: {post.author}</p>}
              <p>
                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <p>👁️ {post.views || 0}</p>
              <p>❤️ {post.likes || 0}</p>
            </div>
          </div>

          {/* 썸네일 */}
          {post.thumbnail_url && (
            <div className="mb-6 rounded-lg overflow-hidden bg-emerald-800">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* 본문 */}
          <div className="prose prose-invert max-w-none">
            {post.description && (
              <div className="bg-emerald-800/30 rounded-lg p-4 mb-6 border border-emerald-700">
                <p className="text-emerald-200 text-lg">{post.description}</p>
              </div>
            )}

            {post.content ? (
              <div className="text-emerald-100 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
            ) : (
              <p className="text-emerald-400 text-center py-8">내용이 없습니다</p>
            )}
          </div>

          {/* 원본 링크 */}
          {post.source_url && (
            <div className="mt-8 pt-6 border-t border-emerald-800">
              <a
                href={post.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition"
              >
                🔗 원본 링크 보기
              </a>
            </div>
          )}
        </article>

        {/* 관련 게시물 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">다른 게시물</h2>
          <p className="text-emerald-400">관련 게시물이 표시됩니다</p>
        </div>
      </div>
    </div>
  )
}
