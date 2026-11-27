import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, redirect } from 'react-router-dom'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Layout } from '@/components/Layout'
import { PageFallback } from '@/components/PageFallback'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function lazyPage(factory: () => Promise<{ default: ComponentType }>): ReactNode {
  const Page = lazy(factory)
  return (
    <Suspense fallback={<PageFallback />}>
      <Page />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  { path: '/index.html', loader: () => redirect('/') },
  { path: '/login.html', loader: () => redirect('/login') },
  { path: '/register.html', loader: () => redirect('/register') },
  { path: '/dashboard.html', loader: () => redirect('/dashboard') },
  { path: '/contact.html', loader: () => redirect('/contact') },
  { path: '/about.html', loader: () => redirect('/about') },
  { path: '/become-pro.html', loader: () => redirect('/courses') },
  { path: '/pro', loader: () => redirect('/courses') },
  { path: '/pricing', loader: () => redirect('/courses') },
  { path: '/payment/success', loader: () => redirect('/courses') },
  { path: '/payment/failed', loader: () => redirect('/courses') },
  { path: '/dashboard/membership', loader: () => redirect('/dashboard') },
  { path: '/forget-password.html', loader: () => redirect('/forgot-password') },
  { path: '/security.html', loader: () => redirect('/dashboard/security') },
  {
    path: '/change-password.html',
    loader: ({ request }) => {
      const token = new URL(request.url).searchParams.get('token')
      return redirect(
        token ? `/reset-password?token=${encodeURIComponent(token)}` : '/reset-password',
      )
    },
  },
  {
    path: '/course-details.html',
    loader: ({ request }) => {
      const slug = new URL(request.url).searchParams.get('slug')
      return redirect(slug ? `/courses/${encodeURIComponent(slug)}` : '/courses')
    },
  },
  {
    element: <Layout />,
    children: [
      { index: true, element: lazyPage(() => import('@/pages/HomePage')) },
      { path: '/about', element: lazyPage(() => import('@/pages/AboutPage')) },
      { path: '/courses', element: lazyPage(() => import('@/pages/CoursesPage')) },
      { path: '/courses/:slug', element: lazyPage(() => import('@/pages/CourseDetailPage')) },
      { path: '/categories', element: lazyPage(() => import('@/pages/CategoriesPage')) },
      { path: '/categories/:slug', element: lazyPage(() => import('@/pages/CategoryDetailPage')) },
      { path: '/paths', element: lazyPage(() => import('@/pages/PathsPage')) },
      { path: '/paths/:slug', element: lazyPage(() => import('@/pages/PathDetailPage')) },
      { path: '/services', element: lazyPage(() => import('@/pages/ServicesPage')) },
      { path: '/services/:slug', element: lazyPage(() => import('@/pages/ServiceDetailPage')) },
      { path: '/work', element: lazyPage(() => import('@/pages/WorkPage')) },
      { path: '/work/:slug', element: lazyPage(() => import('@/pages/WorkDetailPage')) },
      { path: '/testimonials', element: lazyPage(() => import('@/pages/TestimonialsPage')) },
      { path: '/contact', element: lazyPage(() => import('@/pages/ContactPage')) },
      { path: '/faq', element: lazyPage(() => import('@/pages/FaqPage')) },
      { path: '/privacy', element: lazyPage(() => import('@/pages/PrivacyPage')) },
      { path: '/terms', element: lazyPage(() => import('@/pages/TermsPage')) },
      { path: '/search', element: lazyPage(() => import('@/pages/SearchPage')) },
      { path: '*', element: lazyPage(() => import('@/pages/NotFoundPage')) },
    ],
  },
  { path: '/login', element: lazyPage(() => import('@/pages/LoginPage')) },
  { path: '/register', element: lazyPage(() => import('@/pages/RegisterPage')) },
  { path: '/verify-email', element: lazyPage(() => import('@/pages/VerifyEmailPage')) },
  { path: '/forgot-password', element: lazyPage(() => import('@/pages/ForgotPasswordPage')) },
  { path: '/reset-password', element: lazyPage(() => import('@/pages/ResetPasswordPage')) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/learn/:slug/:lessonId?',
        element: lazyPage(() => import('@/pages/LearnPage')),
      },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: lazyPage(() => import('@/pages/DashboardHomePage')) },
          { path: '/dashboard/courses', element: lazyPage(() => import('@/pages/DashboardCoursesPage')) },
          { path: '/dashboard/progress', element: lazyPage(() => import('@/pages/ProgressPage')) },
          { path: '/dashboard/certificates', element: lazyPage(() => import('@/pages/CertificatesPage')) },
          { path: '/dashboard/saved', element: lazyPage(() => import('@/pages/SavedPage')) },
          { path: '/dashboard/notifications', element: lazyPage(() => import('@/pages/NotificationsPage')) },
          { path: '/dashboard/profile', element: lazyPage(() => import('@/pages/ProfilePage')) },
          { path: '/dashboard/settings', element: lazyPage(() => import('@/pages/SettingsPage')) },
          { path: '/dashboard/security', element: lazyPage(() => import('@/pages/SecurityPage')) },
        ],
      },
    ],
  },
])
