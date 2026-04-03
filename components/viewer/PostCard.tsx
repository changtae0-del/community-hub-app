'use client'

import { Post } from '@/types'
import Link from 'next/link'

interface PostCardProps {
  post: Post & { categories?: any }
}

export default function PostCard({ post }: PostCardProps) {
  // category 또는 categories 필드 지원 (API 응답 형식에 따라)
  const category = post.category || post.categories

  return (
    <Link href={`/viewer/${post.id}`}>
      <div className="bg-emerald-900 border border-emerald-800 rounded-lg p-4 hover:border-emerald-600 hover:bg-emerald-800/60 transition cursor-pointer">
        {/* 카테고리 배지 */}
        {category && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: category.color_hex || '#10b981' }}
            ></span>
            <span className="text-xs font-medium text-emerald-300">
              {category.name}
            </span>
          </div>
        )}

        {/* 제목 */}
        <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-emerald-300 transition">
          {post.title}
        </h2>

        {/* 설명 */}
        {post.description && (
          <p className="text-emerald-200 text-sm mb-3 line-clamp-2">
            {post.description}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-xs text-emerald-400">
          <div className="flex gap-4">
            <span>{post.author || 'unknown'}</span>
            <span>
              {new Date(post.created_at).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex gap-3">
            <span>👁️ {post.views || 0}</span>
            <span>❤️ {post.likes || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
