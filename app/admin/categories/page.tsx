'use client'

import { useEffect, useState } from 'react'
import { Category } from '@/types'
import Link from 'next/link'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#059669')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // slug 자동생성
  const generateSlug = (input: string) => {
    return input
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) {
      alert('필수 항목을 입력해주세요')
      return
    }

    setSubmitting(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          icon: icon || null,
          color_hex: color,
          description: description || null
        })
      })

      if (!res.ok) throw new Error('저장 실패')

      const data = await res.json()

      if (editingId) {
        setCategories(categories.map(c => c.id === editingId ? data : c))
      } else {
        setCategories([...categories, data])
      }

      // 폼 초기화
      setName('')
      setSlug('')
      setIcon('')
      setColor('#059669')
      setDescription('')
      setEditingId(null)

      alert(editingId ? '카테고리가 수정되었습니다' : '카테고리가 추가되었습니다')
    } catch (error) {
      alert('오류가 발생했습니다: ' + (error instanceof Error ? error.message : ''))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (cat: Category) => {
    setName(cat.name)
    setSlug(cat.slug)
    setIcon(cat.icon || '')
    setColor(cat.color_hex || '#059669')
    setDescription(cat.description || '')
    setEditingId(cat.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      setCategories(categories.filter(c => c.id !== id))
      alert('카테고리가 삭제되었습니다')
    } catch (error) {
      alert('오류가 발생했습니다')
    }
  }

  const EMOJI_LIST = [
    '📰', '💻', '📚', '🏠', '🎯', '⭐', '🎨', '🎵', '🎮', '⚽',
    '🍕', '🚗', '✈️', '🌍', '💡', '🎓', '💼', '🏥', '🎭', '📸'
  ]

  return (
    <div className="min-h-screen bg-emerald-950">
      {/* 헤더 */}
      <div className="bg-emerald-900 border-b border-emerald-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">🏷️ 카테고리 관리</h1>
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
        {/* 카테고리 추가/수정 폼 */}
        <div className="bg-emerald-900 rounded-lg p-6 mb-8 border border-emerald-800">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingId ? '카테고리 수정' : '새 카테고리 추가'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 이름 */}
              <div>
                <label className="block text-emerald-300 text-sm font-bold mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setSlug(generateSlug(e.target.value))
                  }}
                  placeholder="카테고리 이름"
                  required
                  className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white placeholder-emerald-600"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-emerald-300 text-sm font-bold mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="slug-name"
                  required
                  className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white placeholder-emerald-600"
                />
              </div>
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
                placeholder="카테고리 설명"
                className="w-full bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white placeholder-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 이모지 */}
              <div>
                <label className="block text-emerald-300 text-sm font-bold mb-2">
                  아이콘 (이모지)
                </label>
                <div className="flex gap-2 mb-2">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`text-2xl p-2 rounded transition ${
                        icon === emoji
                          ? 'bg-emerald-600'
                          : 'bg-emerald-800 hover:bg-emerald-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white">
                  선택됨: <span className="text-2xl">{icon || '없음'}</span>
                </div>
              </div>

              {/* 색상 */}
              <div>
                <label className="block text-emerald-300 text-sm font-bold mb-2">
                  색상
                </label>
                <div className="flex gap-3 mb-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-emerald-700"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#XXXXXX"
                    className="flex-1 bg-emerald-950 border border-emerald-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div
                  className="w-full h-10 rounded border border-emerald-700"
                  style={{ backgroundColor: color }}
                />
              </div>
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
                    setName('')
                    setSlug('')
                    setIcon('')
                    setColor('#059669')
                    setDescription('')
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

        {/* 카테고리 리스트 */}
        <div className="bg-emerald-900 rounded-lg border border-emerald-800 overflow-hidden">
          <div className="bg-emerald-800/50 px-6 py-4 border-b border-emerald-700">
            <h3 className="text-lg font-bold text-white">카테고리 목록</h3>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-emerald-300">
              로딩 중...
            </div>
          ) : categories.length === 0 ? (
            <div className="px-6 py-12 text-center text-emerald-300">
              카테고리가 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-emerald-950 border border-emerald-800 rounded-lg p-4 hover:border-emerald-600 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <h4 className="text-white font-bold">{cat.name}</h4>
                        <p className="text-emerald-400 text-xs">{cat.slug}</p>
                      </div>
                    </div>
                    <div
                      className="w-6 h-6 rounded border border-emerald-700"
                      style={{ backgroundColor: cat.color_hex || '#059669' }}
                    />
                  </div>

                  {cat.description && (
                    <p className="text-emerald-300 text-sm mb-3">
                      {cat.description}
                    </p>
                  )}

                  <p className="text-emerald-400 text-xs mb-3">
                    게시물: <strong>{cat.post_count}</strong>개
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="flex-1 text-emerald-400 hover:text-emerald-300 text-sm font-bold transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="flex-1 text-red-400 hover:text-red-300 text-sm font-bold transition"
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
