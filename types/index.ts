export type Role = 'admin' | 'viewer'

export type Subject = {
  id: number
  code: string
  name_ko: string
  color_hex: string
  sort_order: number
}

export type Difficulty = 1 | 2 | 3

export type CorrectAnswer = 1 | 2 | 3 | 4

export type Question = {
  id: string
  subject_id: number
  subject?: Subject
  difficulty: Difficulty
  question_text: string
  option_1: string
  option_2: string
  option_3: string
  option_4: string
  correct_answer: CorrectAnswer
  explanation: string | null
  source_year: number | null
  source_type: 'ai' | 'manual' | 'official'
  is_approved: boolean
  created_at: string
  updated_at: string
}

export type GeneratedQuestion = {
  question_text: string
  option_1: string
  option_2: string
  option_3: string
  option_4: string
  correct_answer: CorrectAnswer
  explanation: string
}

export type DailySchedule = {
  id: string
  schedule_date: string
  question_id: string
  question?: Question
  sort_order: number
}

export type StudySession = {
  id: string
  session_date: string
  started_at: string
  completed_at: string | null
  total_questions: number
  correct_count: number
  score_pct: number | null
  duration_seconds: number | null
  is_completed: boolean
  session_type: 'daily' | 'mock_exam'
  mock_exam_set_id?: string | null
}

export type MockExamSet = {
  id: string
  year: number
  session_number: number | null
  title: string
  description: string | null
  total_questions: number
  created_at: string
}

export type MockExamQuestion = {
  id: string
  mock_exam_set_id: string
  question_id: string
  question?: Question
  sort_order: number
  created_at: string
}

export type MockExamSubjectResult = {
  id: string
  session_id: string
  subject_id: number
  subject?: Subject
  total_questions: number
  correct_count: number
  score_percentage: number | null
  time_limit_seconds: number | null
  time_used_seconds: number | null
  created_at: string
}

export type MockExamAttemptHistory = {
  id: string
  mock_exam_set_id: string
  session_id: string
  total_score: number | null
  average_percentage: number | null
  attempt_date: string
}

export type UserAnswer = {
  id: string
  session_id: string
  question_id: string
  question?: Question
  selected_answer: CorrectAnswer
  is_correct: boolean
  time_taken_ms: number | null
  answered_at: string
}

export type SubjectStat = {
  subject_id: number
  subject_name: string
  color_hex: string
  total_answered: number
  correct_count: number
  correct_pct: number
}

export type DailyScoreTrend = {
  session_date: string
  questions_answered: number
  total_correct: number
  daily_correct_pct: number
}

// ===== Community Hub App Types =====

export type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  color_hex: string | null
  post_count: number
  created_at: string
  updated_at: string
}

export type Post = {
  id: string
  category_id: number
  category?: Category
  title: string
  description: string | null
  content: string | null
  author: string | null
  source_url: string | null
  thumbnail_url: string | null
  likes: number
  views: number
  created_at: string
  updated_at: string
}

export type SavedPost = {
  id: string
  user_role: string
  post_id: string
  post?: Post
  saved_at: string
}
