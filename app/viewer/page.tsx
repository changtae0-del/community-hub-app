'use client'

import { useEffect, useState } from 'react'
import { Post, Category } from '@/types'
import PostCard from '@/components/viewer/PostCard'
import { useInView } from 'react-intersection-observer'

export default function ViewerPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const { ref, inView } = useInView()

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // 게시물 로드
  useEffect(() => {
    const fetchPosts = async () => {
      if (loading) return
      setLoading(true)

      try {
        let url = `/api/posts?page=${page}`
        if (selectedCategoryId) {
          url += `&category_id=${selectedCategoryId}`
        }

        const res = await fetch(url)
        const data = await res.json()

        if (page === 1) {
          setPosts(data.posts)
        } else {
          setPosts((prev) => [...prev, ...data.posts])
        }

        setHasMore(page < data.totalPages)
      } catch (error) {
        console.error('Failed to load posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [page, selectedCategoryId])

  // 무한 스크롤
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage((prev) => prev + 1)
    }
  }, [inView, hasMore, loading])

  // 폴링: 새 게시물 확인 (5초 단위)
  useEffect(() => {
    let lastCheck = new Date().toISOString()

    const checkNewPosts = async () => {
      try {
        const res = await fetch(`/api/posts/new?since=${lastCheck}`)
        const data = await res.json()

        if (data.count > 0) {
          setNewPostsCount(data.count)
          lastCheck = new Date().toISOString()
        }
      } catch (error) {
        console.error('Failed to check new posts:', error)
      }
    }

    const interval = setInterval(checkNewPosts, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-emerald-950">
      {/* 헤더 */}
      <div className="bg-emerald-900 border-b border-emerald-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">📱 커뮤니티 허브</h1>

          {/* 새 게시물 배너 */}
          {newPostsCount > 0 && (
            <div className="bg-emerald-700/50 border border-emerald-600 rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-white text-sm">
                새로운 게시물 <strong>{newPostsCount}개</strong>
              </span>
              <button
                onClick={() => {
                  setPage(1)
                  setNewPostsCount(0)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1 rounded transition"
              >
                새로운 게시물 보기
              </button>
            </div>
          )}

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => {
                setSelectedCategoryId(null)
                setPage(1)
              }}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategoryId === null
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
              }`}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCategoryId === cat.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 게시물 리스트 */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-emerald-300 text-lg">게시물이 없습니다</p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* 무한 스크롤 트리거 */}
        {hasMore && (
          <div ref={ref} className="py-8 text-center">
            {loading && <p className="text-emerald-300">로딩 중...</p>}
          </div>
        )}
      </div>
    </div>
  )
}
