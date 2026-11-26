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
  can_view: boolean
  is_completed: boolean
  is_locked: boolean
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
}

export type Plan = {
  id: number
  subscription_list: string
  subscription_price: number
}

export type MfaStatus = {
  enabled: boolean
  required: boolean
  methods: string[]
  recovery_codes_remaining: number
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
  user: User
  message?: string
}

export type LessonProgress = {
  id: number
  module: number
  completed: boolean
  updated_at: string
}

export type MessageResponse = {
  message: string
}
