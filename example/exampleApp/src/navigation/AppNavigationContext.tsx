import { createContext, useContext } from 'react'

export type RouteName = 'Home' | 'PushNotification' | 'NotificationCenter'

export type AppNavigation = {
  navigate(name: RouteName): void
  goBack(): void
}

const AppNavigationContext = createContext<AppNavigation | null>(null)

export function useAppNavigation(): AppNavigation {
  const value = useContext(AppNavigationContext)
  if (value == null) {
    throw new Error('useAppNavigation must be used within AppNavigationContext.Provider')
  }
  return value
}

export { AppNavigationContext }
