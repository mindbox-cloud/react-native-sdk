import { readFileSync } from 'fs'
import { join } from 'path'

type PropKind = 'boolean' | 'number' | 'string'

type SpecProp = {
  name: string
  kind: PropKind
  defaultValue: boolean | number | undefined
}

type ReactPropAnnotation = {
  name: string
  setter: string
  defaultBoolean: boolean
  defaultDouble: number
}

const NUMBER_TYPES = ['Double', 'Float', 'Int32']

const readSource = (...segments: string[]) => readFileSync(join(__dirname, '..', '..', ...segments), 'utf8')

const kindOf = (type: string): PropKind => {
  if (type === 'boolean') {
    return 'boolean'
  }
  return NUMBER_TYPES.includes(type) ? 'number' : 'string'
}

const literalOf = (literal: string): boolean | number | undefined => {
  if (literal === 'true' || literal === 'false') {
    return literal === 'true'
  }
  const number = Number(literal)
  return Number.isNaN(number) ? undefined : number
}

const toSpecProp = (name: string, type: string): SpecProp => {
  const withDefault = /^WithDefault<\s*(\w+)\s*,\s*(.+?)\s*>$/.exec(type)
  const kind = kindOf(withDefault ? withDefault[1] : type)
  if (withDefault) {
    return { name, kind, defaultValue: literalOf(withDefault[2]) }
  }
  const implicitDefaults: Record<PropKind, boolean | number | undefined> = { boolean: false, number: 0, string: undefined }
  return { name, kind, defaultValue: implicitDefaults[kind] }
}

const parseSpecProps = (source: string): SpecProp[] => {
  const body = /interface NativeProps extends ViewProps \{([\s\S]*?)\n\}/.exec(source)?.[1] ?? ''
  const declarations = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  return Array.from(declarations.matchAll(/^\s*(\w+)\?:\s*(.+?)\s*$/gm))
    .filter(([, , type]) => !type.includes('EventHandler<'))
    .map(([, name, type]) => toSpecProp(name, type))
}

const parseAnnotations = (source: string): ReactPropAnnotation[] =>
  Array.from(source.matchAll(/@ReactProp\(([^)]*)\)\s*override fun (\w+)\(/g)).map(([, args, setter]) => {
    const argument = (key: string) => new RegExp(`${key}\\s*=\\s*"?([^",\\s)]+)`).exec(args)?.[1]
    return {
      name: argument('name') ?? '',
      setter,
      defaultBoolean: argument('defaultBoolean') === 'true',
      defaultDouble: Number(argument('defaultDouble') ?? 0),
    }
  })

const setterOf = (prop: string) => `set${prop[0].toUpperCase()}${prop.slice(1)}`

const specSource = readSource('src', 'MindboxEmbeddedBlockNativeComponent.ts')
const viewManagerSource = readSource('android', 'src', 'main', 'java', 'com', 'mindboxsdk', 'embedded', 'MindboxEmbeddedBlockViewManager.kt')

const specProps = parseSpecProps(specSource)
const annotations = parseAnnotations(viewManagerSource)

describe('MindboxEmbeddedBlockViewManager props on Android without bridgeless', () => {
  it('reads the props of the codegen spec, leaving the events out', () => {
    const names = specProps.map((prop) => prop.name)

    expect(names).toContain('placeSystemName')
    expect(names).not.toContain('onBlockOutcome')
  })

  it('puts @ReactProp on the setter of every prop of the spec', () => {
    const missing = specProps.filter((prop) => !annotations.some((annotation) => annotation.name === prop.name && annotation.setter === setterOf(prop.name)))

    expect(missing.map((prop) => prop.name)).toEqual([])
  })

  it('gives every @ReactProp the default of the spec', () => {
    const mismatched = specProps.flatMap((prop) => {
      const annotation = annotations.find((candidate) => candidate.name === prop.name)
      if (!annotation || prop.kind === 'string') {
        return []
      }
      const actual = prop.kind === 'boolean' ? annotation.defaultBoolean : annotation.defaultDouble
      return actual === prop.defaultValue ? [] : [`${prop.name}: @ReactProp default ${actual}, spec default ${prop.defaultValue}`]
    })

    expect(mismatched).toEqual([])
  })

  it('puts @ReactProp on no prop the spec does not have', () => {
    const unknown = annotations.filter((annotation) => !specProps.some((prop) => prop.name === annotation.name))

    expect(unknown.map((annotation) => annotation.name)).toEqual([])
  })

  it('puts every @ReactProp right on an overriding setter', () => {
    const annotationCount = (viewManagerSource.match(/@ReactProp\(/g) ?? []).length

    expect(annotations).toHaveLength(annotationCount)
  })
})
