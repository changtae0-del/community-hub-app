'use client'

import { Post } from '@/types'
import { useState } from 'react'
import Link from 'next/link'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSaved) {
        // 저장 해제
        await fetch(`/api/saved-posts/${post.id}?user_role=viewer`, {
          method: 'DELETE'
        })
      } else {
        // 저장
        await fetch('/api/saved-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id, user_role: 'viewer' })
        })
      }
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Failed to save post:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제'
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <Link href={`/viewer/${post.id}`}>
      <div className="bg-emerald-900 rounded-xl p-4 border border-emerald-800 hover:border-emerald-600 transition cursor-pointer hover:bg-emerald-800/50">
        {/* 카테고리 배지 */}
        {post.category && (
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: post.category.color_hex || '#10b981' }}
            ></span>
            <span className="text-xs text-emerald-300">{post.category.name}</span>
          </div>
        )}

        {/* 제목 */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{post.title}</h3>

        {/* 설명 */}
        {post.description && (
          <p className="text-emerald-200 text-sm mb-3 line-clamp-2">{post.description}</p>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-emerald-400">
            <span>👁️ {post.views || 0}</span>
            <span>❤️ {post.likes || 0}</span>
            <span>{formatDate(post.created_at)}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`transition ${
              isSaved
                ? 'text-yellow-400 hover:text-yellow-300'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            {isSaved ? '⭐' : '☆'}
          </button>
        </div>
      </div>
    </Link>
  )
}
