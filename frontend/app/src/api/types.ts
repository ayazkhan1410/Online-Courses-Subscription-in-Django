export type User = {
  id: number
  username: string
  email: string
  full_name: string
  user_choices: string
  is_pro: boolean
}

export type Module = {
  id: number
  module_name: string
  module_description: string
  module_video: string | null
  embed_url: string | null
  youtube_video_id: string | null
  thumbnail_url: string | null
  sort_order: number
  duration_seconds?: number | null
  can_view: boolean
  is_completed: boolean
  is_locked: boolean
  position_seconds?: number
}

export type Category = {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  sort_order: number
  is_featured: boolean
  published_course_count: number
  cover_image_url?: string
}

export type CategoryBrief = {
  name: string
  slug: string
  icon: string
}

export type Creator = {
  name: string
  slug: string
  avatar_url: string
  channel_url: string
  is_owner: boolean
}

export type Course = {
  id: number
  courses_name: string
  courses_description: string
  is_premium: boolean
  course_image: string | null
  thumbnail_url: string
  playlist_url: string
  youtube_playlist_id: string | null
  slug: string
  status?: string
  level: string
  language: string
  category: CategoryBrief | null
  creator: Creator | null
  attribution: string
  module_count: number
  is_enrolled: boolean
  is_wishlisted: boolean
  progress_percent: number
  last_accessed_at?: string | null
  course_modules?: Module[]
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Enrollment = {
  id: number
  course: Course
  enrolled_at: string
  last_accessed_at: string | null
}

export type WishlistItem = {
  id: number
  course: Course
  created_at: string
}

export type DashboardUser = {
  id: number
  email: string
  username: string
  full_name: string
  display_name: string
  is_pro: boolean
}

export type DashboardStats = {
  enrolled_courses: number
  completed_courses: number
  completed_lessons: number
  wishlist_count: number
  avg_progress: number
}

export type Dashboard = {
  user: DashboardUser
  stats: DashboardStats
  enrolled: Enrollment[]
  continue_learning: Course[]
  recent: Course[]
  wishlist: WishlistItem[]
  recommended: Course[]
}

export type AppConfig = {
  stripe_publishable_key: string
  google_client_id: string
  turnstile_site_key: string
  fiverr_profile_url?: string
  published_course_count?: number
  category_count?: number
}

export type VerificationRequired = {
  verification_required: true
  email: string
}

export type PathStepBrief = {
  sort_order?: number
  note?: string
  course: {
    slug: string
    title: string
    thumbnail?: string
  }
}

export type LearningPath = {
  title: string
  slug: string
  summary: string
  level: string
  step_count?: number
  course_count?: number
  steps?: PathStepBrief[]
  course_names?: string[]
  completed_count?: number
  total_count?: number
}

export type PathStepDetail = {
  sort_order: number
  note: string
  course: Course
}

export type LearningPathDetail = {
  title: string
  slug: string
  summary: string
  level: string
  steps: PathStepDetail[]
}

export type Project = {
  title: string
  slug: string
  summary: string
  tech: string
  tech_list?: string[]
  live_url?: string | null
  repo_url?: string | null
}

export type MfaStatus = {
  enabled: boolean
  method: string
  available_to_enable: string[]
  has_password: boolean
  required?: boolean
  methods?: string[]
  recovery_codes_remaining?: number
}

export type MfaSetup = {
  otpauth_url: string
  qr_svg: string
  manual_key: string
}

export type MfaChallenge = {
  mfa_required: true
  challenge_token: string
  methods: string[]
}

export type AuthSuccess = {
  token: string
  access?: string
  refresh?: string
  user: User
  message?: string
}

export type LessonProgress = {
  id: number
  module: number
  completed: boolean
  position_seconds?: number
  updated_at: string
}

export type MessageResponse = {
  message: string
}
