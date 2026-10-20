// Route table, not a component module: Fast Refresh does not apply here.
// oxlint-disable react/only-export-components
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui'
import { PublicOnly, RequireAuth, RequireRole } from '@/features/auth'
import NotFoundPage from './NotFoundPage'

const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage'))
const TitleDetailPage = lazy(() => import('@/features/catalog/TitleDetailPage'))
const PlayerPage = lazy(() => import('@/features/player/PlayerPage'))
const AccountPage = lazy(() => import('@/features/account/AccountPage'))
const ContentPage = lazy(() => import('@/features/admin/content/ContentPage'))
const MovieSeriesFormPage = lazy(() => import('@/features/admin/content/MovieSeriesFormPage'))
const MultimediaAdminPage = lazy(() => import('@/features/admin/multimedia/MultimediaAdminPage'))
const GenresPage = lazy(() => import('@/features/admin/genres/GenresPage'))
const UsersPage = lazy(() => import('@/features/admin/users/UsersPage'))

const page = (Component) => (
  <Suspense fallback={<Spinner />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [{ path: '/login', element: page(LoginPage) }],
  },
  {
    element: <RequireAuth />,
    children: [
      // The player is full-bleed, without the sidebar.
      { path: '/watch/:multimediaId', element: page(PlayerPage) },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: page(CatalogPage) },
          { path: '/titles/:id', element: page(TitleDetailPage) },
          { path: '/account', element: page(AccountPage) },
          {
            path: '/admin',
            element: <RequireRole role="ADMIN" />,
            children: [
              { index: true, element: <Navigate to="/admin/content" replace /> },
              { path: 'content', element: page(ContentPage) },
              { path: 'content/new', element: page(MovieSeriesFormPage) },
              { path: 'content/:id/edit', element: page(MovieSeriesFormPage) },
              { path: 'multimedia', element: page(MultimediaAdminPage) },
              { path: 'genres', element: page(GenresPage) },
              { path: 'users', element: page(UsersPage) },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
