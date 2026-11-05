// `@types/react-native` 0.62.13 lacks `children` on `ViewProps` and `TextProps`; delete this file with that dependency.

export {}

declare module 'react-native' {
  interface ViewProps {
    children?: import('react').ReactNode
  }

  interface TextProps {
    children?: import('react').ReactNode
  }
}
