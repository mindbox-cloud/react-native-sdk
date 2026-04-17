import React, { useMemo, useState } from 'react'
import { AppNavigationContext, RouteName } from './navigation/AppNavigationContext'
import HomeScreen from './screens/HomeScreen'
import PushNotificationScreen from './screens/PushNotificationScreen'
import NotificationCenterScreen from './screens/NotificationCenterScreen'

function App() {
  const [route, setRoute] = useState<RouteName>('Home')
  const navigation = useMemo(
    () => ({
      navigate: (name: RouteName) => {
        setRoute(name)
      },
      goBack: () => {
        setRoute('Home')
      },
    }),
    []
  )
  return (
    <AppNavigationContext.Provider value={navigation}>
      {route === 'Home' ? <HomeScreen /> : null}
      {route === 'PushNotification' ? <PushNotificationScreen /> : null}
      {route === 'NotificationCenter' ? <NotificationCenterScreen /> : null}
    </AppNavigationContext.Provider>
  )
}

export default App
