'use client'

import { useEffect, useState } from 'react'
import { Post, Category } from '@/types'
import Link from 'next/link'

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        setCategories(data)
        if (data.length > 0) {
          setCategoryId(data[0].id)
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // 게시물 로드
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts?limit=100')
        const data = await res.json()
        setPosts(data.posts || [])
      } catch (error) {
        console.error('Failed to load posts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId) {
      alert('카테고리를 선택해주세요')
      return
    }

    setSubmitting(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/posts/${editingId}` : '/api/posts'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          title,
          description,
          content,
          author,
          source_url: sourceUrl || null
        })
      })

      if (!res.ok) throw new Error('저장 실패')

      const data = await res.json()

      if (editingId) {
        setPosts(posts.map(p => p.id === editingId ? data : p))
      } else {
        setPosts([data, ...posts])
      }

      // 폼 초기화
      setTitle('')
      setDescription('')
      setContent('')
      setAuthor('')
      setSourceUrl('')
      setCategoryId(categories[0]?.id || null)
      setEditingId(null)

      alert(editingId ? '게시물이 수정되었습니다' : '게시물이 추가되었습니다')
    } catch (error) {
      alert('오류가 발생했습니다: ' + (error instanceof Error ? error.message : ''))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (post: Post) => {
    setTitle(post.title)
    setDescription(post.description || '')
    setContent(post.content || '')
    setAuthor(post.author || '')
    setSourceUrl(post.source_url || '')
    setCategoryId(post.category_id)
    setEditingId(post.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      setPosts(posts.filter(p => p.id !== id))
      alert('게시물이 삭제되었습니다')
    } catch (error) {
      alert('오류가 발생했습니다')
    }
  }

  return (
    <div className="min-h-screen bg-emerald-950">
      {/* 헤더 */}
      <div className="bg-emerald-900 border-b border-emerald-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">📝 게시물 관리</h1>
            <Link
              href="/admin"
              className="text-emerald-300 hover:text-white transition"
            >
              ← 대시보드
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 게시물 추가/수정 폼 */}
        <div className="bg-emerald-900 rounded-lg p-6 mb-8 border border-emerald-800">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingId ? '게시물 수정' : '새 게시물 추가'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-emerald-300 text-sm font-bold mb-2">
                카테고리
              </label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-emerald-300 text-sm font-bold mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시물 제목"
                required
                className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white placeholder-emerald-600"
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-emerald-300 text-sm font-bold mb-2">
                설명
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="짧은 설명"
                className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white placeholder-emerald-600"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-emerald-300 text-sm font-bold mb-2">
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="게시물 내용"
                rows={6}
                className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white placeholder-emerald-600"
              />
            </div>

            {/* 작성자 */}
            <div>
              <label className="block text-emerald-300 text-sm font-bold mb-2">
                작성자
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="작성자명"
                className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white placeholder-emerald-600"
              />
            </div>

            {/* 원본 링크 */}
            <div>
              <label className="block text-emerald-300 text-sm font-bold mb-2">
                원본 링크
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white placeholder-emerald-600"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition"
              >
                {submitting ? '저장 중...' : editingId ? '수정하기' : '추가하기'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setTitle('')
                    setDescription('')
                    setContent('')
                    setAuthor('')
                    setSourceUrl('')
                    setCategoryId(categories[0]?.id || null)
                    setEditingId(null)
                  }}
                  className="px-6 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 게시물 리스트 */}
        <div className="bg-emerald-900 rounded-lg border border-emerald-800 overflow-hidden">
          <div className="bg-emerald-800/50 px-6 py-4 border-b border-emerald-700">
            <h3 className="text-lg font-bold text-white">게시물 목록</h3>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-emerald-300">
              로딩 중...
            </div>
          ) : posts.length === 0 ? (
            <div className="px-6 py-12 text-center text-emerald-300">
              게시물이 없습니다
            </div>
          ) : (
            <div className="divide-y divide-emerald-800">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="px-6 py-4 hover:bg-emerald-800/30 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-bold mb-1">{post.title}</h4>
                      <p className="text-emerald-300 text-sm mb-2">
                        {post.category?.name} • {post.author || '익명'} •{' '}
                        {new Date(post.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      {post.description && (
                        <p className="text-emerald-200 text-sm line-clamp-2">
                          {post.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-bold transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
