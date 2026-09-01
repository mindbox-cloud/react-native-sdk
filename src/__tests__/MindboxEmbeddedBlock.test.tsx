import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import { MindboxEmbeddedBlock } from '../MindboxEmbeddedBlock'

// The native component is the boundary under test: the suite checks what crosses it — the props the
// container reads and the two signals it sends back — not what the container does with them. Those
// rules live in the native SDKs and are covered by their own suites.
jest.mock('../MindboxEmbeddedBlockNativeComponent', () => {
  const ReactActual = require('react')
  const { View: RNView } = require('react-native')
  return {
    __esModule: true,
    default: (props: unknown) => ReactActual.createElement(RNView, { ...(props as object), testID: 'native-block' }),
  }
})

// The `any` casts below keep the suite indifferent to which @types/react the renderer's typings
// resolve to: the SDK pins React 18, while a host app may typecheck this tree against React 19 or a
// nested duplicate copy — and element and component types from two copies never match each other.
const render = (element: React.ReactElement<any>): ReactTestRenderer => {
  let renderer: ReactTestRenderer
  act(() => {
    renderer = create(element as any)
  })
  return renderer!
}

const update = (renderer: ReactTestRenderer, element: React.ReactElement<any>) => {
  act(() => {
    renderer.update(element as any)
  })
}

const asType = (component: unknown) => component as any

const nativeProps = (renderer: ReactTestRenderer) => renderer.root.findByProps({ testID: 'native-block' }).props

const reportAppearance = (renderer: ReactTestRenderer, appearance: string) => {
  act(() => {
    nativeProps(renderer).onAppearanceChange({ nativeEvent: { appearance } })
  })
}

/** The outermost view is the frame that owns the height the host sees. */
const frameHeight = (renderer: ReactTestRenderer) => {
  const frame = renderer.root.findAllByType(asType(View))[0]
  return StyleSheet.flatten(frame.props.style).height
}

describe('MindboxEmbeddedBlock', () => {
  it('takes its height while loading and hands it back when the block collapses', () => {
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} />)

    expect(frameHeight(renderer)).toBe(104)

    reportAppearance(renderer, 'collapsed')

    expect(frameHeight(renderer)).toBe(0)
  })

  it('resizes a live block in place when the height changes', () => {
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={160} />)

    update(renderer, <MindboxEmbeddedBlock placeSystemName="stories" height={80} />)

    expect(frameHeight(renderer)).toBe(80)
    expect(nativeProps(renderer).blockHeight).toBe(80)
  })

  it('warns once about a place system name with spaces around it', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(<MindboxEmbeddedBlock placeSystemName=" stories " height={104} />)

    update(renderer, <MindboxEmbeddedBlock placeSystemName=" stories " height={104} />)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('spaces around it')
    warn.mockRestore()
  })

  it('warns once about a place system name that is not there at all', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="" height={104} />)

    update(renderer, <MindboxEmbeddedBlock placeSystemName="" height={104} />)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('without a place system name')
    // Handed to the native side as it is: a nameless place has to collapse and report, not hang.
    expect(nativeProps(renderer).placeSystemName).toBe('')
    warn.mockRestore()
  })

  it('calls a name of nothing but spaces a missing name, not a padded one', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(<MindboxEmbeddedBlock placeSystemName="   " height={104} />)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('without a place system name')
    expect(warn.mock.calls[0][0]).not.toContain('spaces around it')
    warn.mockRestore()
  })

  it('hands the failure of a nameless place to the host and gives the space back', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const onFail = jest.fn()
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="" height={104} onFail={onFail} />)

    reportAppearance(renderer, 'collapsed')
    act(() => {
      nativeProps(renderer).onBlockFail()
    })

    expect(onFail).toHaveBeenCalledTimes(1)
    expect(frameHeight(renderer)).toBe(0)
    warn.mockRestore()
  })

  // Zero, negative and not-a-number are one case to the block — no space is no space — and the suite
  // says so for each of them, since each arrives from a different mistake: a height left unset, a
  // height computed into the negative, and a height computed from something that was not there.
  it.each([
    ['zero', 0],
    ['negative', -104],
    ['not a number', Number.NaN],
  ])('warns about a %s height that reserves no space and hands the layout zero', (_name, height) => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={height} />)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('reserves no space')
    expect(frameHeight(renderer)).toBe(0)
    // Never a negative number across the boundary: the native side is handed the space it can lay out.
    expect(nativeProps(renderer).blockHeight).toBe(0)
    warn.mockRestore()
  })

  it('tells the native block the place, the height and whether the place is taken', () => {
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} placeholder={<Text>wait</Text>} active={false} />)

    expect(nativeProps(renderer)).toMatchObject({
      placeSystemName: 'stories',
      blockHeight: 104,
      hasPlaceholder: true,
      hasErrorView: false,
      hostVisible: false,
    })
  })

  it('sends zero for a timeout the host did not set', () => {
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} />)

    expect(nativeProps(renderer).timeoutMs).toBe(0)
  })

  it('sends the timeout it was created with, in milliseconds', () => {
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} timeoutMs={5000} />)

    expect(nativeProps(renderer).timeoutMs).toBe(5000)
  })

  it('keeps the timeout it was created with and warns once about a change', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} timeoutMs={5000} />)

    update(renderer, <MindboxEmbeddedBlock placeSystemName="stories" height={104} timeoutMs={1000} />)
    update(renderer, <MindboxEmbeddedBlock placeSystemName="stories" height={104} timeoutMs={2000} />)

    expect(nativeProps(renderer).timeoutMs).toBe(5000)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('draws the host placeholder over the loading block and the host error over the failed one', () => {
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} placeholder={<Text>loading</Text>} error={<Text>broken</Text>} />)

    expect(renderer.root.findByType(asType(Text)).props.children).toBe('loading')

    reportAppearance(renderer, 'content')

    expect(renderer.root.findAllByType(asType(Text))).toHaveLength(0)

    reportAppearance(renderer, 'error')

    expect(renderer.root.findByType(asType(Text)).props.children).toBe('broken')
  })

  it('delivers each outcome once and a changed outcome again', () => {
    const onLoad = jest.fn()
    const onFail = jest.fn()
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onLoad={onLoad} onFail={onFail} />)

    act(() => {
      nativeProps(renderer).onBlockLoad()
      nativeProps(renderer).onBlockLoad()
    })

    expect(onLoad).toHaveBeenCalledTimes(1)

    act(() => {
      nativeProps(renderer).onBlockFail()
    })

    expect(onFail).toHaveBeenCalledTimes(1)
  })

  it('ignores an appearance it does not know, keeping the last known one', () => {
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} />)

    reportAppearance(renderer, 'collapsed')
    reportAppearance(renderer, 'sideways')

    expect(frameHeight(renderer)).toBe(0)
  })

  it('builds a different place as a different block, with nothing remembered', () => {
    const onLoad = jest.fn()
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onLoad={onLoad} />)

    act(() => {
      nativeProps(renderer).onBlockLoad()
    })
    update(renderer, <MindboxEmbeddedBlock placeSystemName="banner" height={104} onLoad={onLoad} />)
    act(() => {
      nativeProps(renderer).onBlockLoad()
    })

    expect(onLoad).toHaveBeenCalledTimes(2)
  })
})
