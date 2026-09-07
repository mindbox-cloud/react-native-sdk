/**
 * `children` on the React Native views this package draws with.
 *
 * `@types/react-native@0.62.13` — the version this repo pins — describes `ViewProps` and
 * `TextProps` without `children`, so nesting anything inside a `<View>` is an error. It never came
 * up before: until the embedded block there was no JSX under `src/` at all.
 *
 * This is an augmentation, not a redeclaration: the top-level `export {}` is what makes the file a
 * module, and without it the `declare module` below would replace React Native's typings instead of
 * adding to them.
 *
 * Delete this file together with the `@types/react-native` dependency, once the pinned React Native
 * is one that ships its own TypeScript types.
 */

export {}

declare module 'react-native' {
  interface ViewProps {
    children?: import('react').ReactNode
  }

  interface TextProps {
    children?: import('react').ReactNode
  }
}
