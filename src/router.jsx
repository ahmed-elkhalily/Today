// TanStack Router wiring.
//
// The whole app lives in one stateful class component (LearningTracker) that
// owns projects, the running timer, notes, etc. Remounting it on every route
// change would wipe that state, so it is rendered ONCE in the router's root
// route and persists across navigation. The URL drives which screen it shows:
// the root reads the current pathname, maps it to a screen id, and passes that
// (plus a `go` navigator) down as props. Child routes exist only to register
// valid paths — they render nothing.
import React from 'react'
import {
  createRouter, createRootRoute, createRoute, RouterProvider,
  Outlet, useNavigate, useRouterState,
} from '@tanstack/react-router'
import LearningTracker from './LearningTracker'

const SCREEN_TO_PATH = {
  today: '/', goals: '/goals', focus: '/focus', log: '/log',
  curr: '/curriculum', stats: '/stats', notes: '/notes',
}
const PATH_TO_SCREEN = Object.fromEntries(Object.entries(SCREEN_TO_PATH).map(([s, p]) => [p, s]))

function RoutedApp() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const screen = PATH_TO_SCREEN[pathname] || 'today'
  const go = (s) => navigate({ to: SCREEN_TO_PATH[s] || '/' })
  return <LearningTracker look="slate" screen={screen} go={go} />
}

// Root renders the persistent app above an (empty) Outlet for the matched child.
function Root() {
  return (
    <>
      <RoutedApp />
      <Outlet />
    </>
  )
}

const rootRoute = createRootRoute({ component: Root })
const screenRoutes = Object.values(SCREEN_TO_PATH).map((path) =>
  createRoute({ getParentRoute: () => rootRoute, path, component: () => null })
)
const routeTree = rootRoute.addChildren(screenRoutes)
export const router = createRouter({ routeTree })

export default function AppRouter() {
  return <RouterProvider router={router} />
}
