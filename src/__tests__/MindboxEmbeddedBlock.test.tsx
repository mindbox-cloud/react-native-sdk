import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import { MindboxEmbeddedBlock } from '../MindboxEmbeddedBlock'
import { MindboxEmbeddedBlockFailReason } from '../MindboxEmbeddedBlockFailReason'

jest.mock('../MindboxEmbeddedBlockNativeComponent', () => {
  const ReactActual = require('react')
  const { View: RNView } = require('react-native')
  return {
    __esModule: true,
    default: (props: unknown) => ReactActual.createElement(RNView, { ...(props as object), testID: 'native-block' }),
  }
})

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

/** The native block's report of how the load ended; an empty reason is what the event carries when there is none. */
const reportOutcome = (renderer: ReactTestRenderer, outcome: string, reason = '') => {
  act(() => {
    nativeProps(renderer).onBlockOutcome({ nativeEvent: { outcome, reason } })
  })
}

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

  it('says nothing about space around a name the SDK trims anyway', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(<MindboxEmbeddedBlock placeSystemName=" stories " height={104} />)

    update(renderer, <MindboxEmbeddedBlock placeSystemName=" stories " height={104} />)

    expect(warn).not.toHaveBeenCalled()
    expect(nativeProps(renderer).placeSystemName).toBe(' stories ')
    warn.mockRestore()
  })

  it('warns once about a place system name that is not there at all', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="" height={104} />)

    update(renderer, <MindboxEmbeddedBlock placeSystemName="" height={104} />)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('without a place system name')
    expect(nativeProps(renderer).placeSystemName).toBe('')
    warn.mockRestore()
  })

  it('calls a name of nothing but spaces a missing name, not a padded one', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(<MindboxEmbeddedBlock placeSystemName="   " height={104} />)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('without a place system name')
    warn.mockRestore()
  })

  it('hands the failure of a nameless place to the host and gives the space back', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const onFail = jest.fn()
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="" height={104} onFail={onFail} />)

    reportAppearance(renderer, 'collapsed')
    reportOutcome(renderer, 'fail', 'internalError')

    expect(onFail).toHaveBeenCalledTimes(1)
    expect(onFail).toHaveBeenCalledWith('internalError')
    expect(frameHeight(renderer)).toBe(0)
    warn.mockRestore()
  })

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

  describe('the outcome', () => {
    it('delivers each outcome once and a changed outcome again', () => {
      const onLoad = jest.fn()
      const onFail = jest.fn()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onLoad={onLoad} onFail={onFail} />)

      reportOutcome(renderer, 'load')
      reportOutcome(renderer, 'load')

      expect(onLoad).toHaveBeenCalledTimes(1)

      reportOutcome(renderer, 'fail', 'networkError')

      expect(onFail).toHaveBeenCalledTimes(1)
    })

    it('reports an empty place through onEmpty, with the space given back and no reason', () => {
      const onEmpty = jest.fn()
      const onFail = jest.fn()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onEmpty={onEmpty} onFail={onFail} />)

      reportAppearance(renderer, 'collapsed')
      reportOutcome(renderer, 'empty')

      expect(onEmpty).toHaveBeenCalledTimes(1)
      expect(onEmpty).toHaveBeenCalledWith()
      expect(onFail).not.toHaveBeenCalled()
      expect(frameHeight(renderer)).toBe(0)
    })

    it('hands the failure reason to onFail as the native block spelled it', () => {
      const onFail = jest.fn()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onFail={onFail} />)

      reportOutcome(renderer, 'fail', 'networkError')

      expect(onFail).toHaveBeenCalledWith(MindboxEmbeddedBlockFailReason.networkError)
    })

    it('passes a reason it does not know through as it is', () => {
      const onFail = jest.fn()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onFail={onFail} />)

      reportOutcome(renderer, 'fail', 'sideways')

      expect(onFail).toHaveBeenCalledWith('sideways')
    })

    it('calls a failure without a reason an internal error', () => {
      const onFail = jest.fn()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onFail={onFail} />)

      reportOutcome(renderer, 'fail')

      expect(onFail).toHaveBeenCalledWith(MindboxEmbeddedBlockFailReason.internalError)
    })

    it('delivers a failure that repeats with another reason once', () => {
      const onFail = jest.fn()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onFail={onFail} />)

      reportOutcome(renderer, 'fail', 'networkError')
      reportOutcome(renderer, 'fail', 'internalError')

      expect(onFail).toHaveBeenCalledTimes(1)
      expect(onFail).toHaveBeenCalledWith('networkError')
    })

    it('delivers a sequence of outcomes in order, repeats dropped', () => {
      const delivered: Array<string> = []
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onLoad={() => delivered.push('load')} onEmpty={() => delivered.push('empty')} onFail={(reason) => delivered.push(`fail:${reason}`)} />)

      reportOutcome(renderer, 'empty')
      reportOutcome(renderer, 'empty')
      reportOutcome(renderer, 'load')
      reportOutcome(renderer, 'fail', 'networkError')

      expect(delivered).toEqual(['empty', 'load', 'fail:networkError'])
    })

    it('ignores an outcome it does not know', () => {
      const onLoad = jest.fn()
      const onEmpty = jest.fn()
      const onFail = jest.fn()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onLoad={onLoad} onEmpty={onEmpty} onFail={onFail} />)

      reportOutcome(renderer, 'sideways')

      expect(onLoad).not.toHaveBeenCalled()
      expect(onEmpty).not.toHaveBeenCalled()
      expect(onFail).not.toHaveBeenCalled()
    })

    it('calls the handler the host passed last, not the one it passed first', () => {
      const first = jest.fn()
      const second = jest.fn()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onLoad={first} />)

      update(renderer, <MindboxEmbeddedBlock placeSystemName="stories" height={104} onLoad={second} />)
      reportOutcome(renderer, 'load')

      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledTimes(1)
    })
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

    reportOutcome(renderer, 'load')
    update(renderer, <MindboxEmbeddedBlock placeSystemName="banner" height={104} onLoad={onLoad} />)
    reportOutcome(renderer, 'load')

    expect(onLoad).toHaveBeenCalledTimes(2)
  })
})

describe('MindboxEmbeddedBlockFailReason', () => {
  it('names the reasons by the raw values the native blocks report', () => {
    expect(MindboxEmbeddedBlockFailReason.networkError).toBe('networkError')
    expect(MindboxEmbeddedBlockFailReason.internalError).toBe('internalError')
  })

  it('is a string, so a word a later SDK adds is still a reason', () => {
    const reason: MindboxEmbeddedBlockFailReason = 'quotaExceeded'

    expect(reason).toBe('quotaExceeded')
  })
})
