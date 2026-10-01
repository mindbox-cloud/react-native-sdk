import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import { MindboxEmbeddedBlock } from '../MindboxEmbeddedBlock'
import { MindboxEmbeddedBlockFailReason } from '../MindboxEmbeddedBlockFailReason'
import { MindboxEmbeddedBlockLoadingStrategy } from '../MindboxEmbeddedBlockLoadingStrategy'
import { askInitialAppearance } from '../MindboxEmbeddedBlockNativeModule'

jest.mock('../MindboxEmbeddedBlockNativeComponent', () => {
  const ReactActual = require('react')
  const { View: RNView } = require('react-native')
  return {
    __esModule: true,
    default: (props: unknown) => ReactActual.createElement(RNView, { ...(props as object), testID: 'native-block' }),
  }
})

jest.mock('../MindboxEmbeddedBlockNativeModule', () => ({
  askInitialAppearance: jest.fn(),
}))

const firstLook = askInitialAppearance as jest.MockedFunction<typeof askInitialAppearance>

/** The module never answers: an `automatic` block stays as it started until the native block reports. */
const holdFirstLook = () => firstLook.mockImplementation(() => new Promise(() => undefined))

const answerFirstLookWith = (word: string) => firstLook.mockResolvedValue(word)

const forgetFirstLook = () => firstLook.mockRejectedValue(new Error('no module'))

/** Lets the module's answer, a promise, reach the component. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

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

const reportAppearance = (renderer: ReactTestRenderer, appearance: string, reveal: { animated: boolean; revealDurationMs: number } = { animated: false, revealDurationMs: 0 }) => {
  act(() => {
    nativeProps(renderer).onAppearanceChange({ nativeEvent: { appearance, ...reveal } })
  })
}

/** The native block's report of how the load ended; an empty reason is what the event carries when there is none. */
const reportOutcome = (renderer: ReactTestRenderer, outcome: string, reason = '') => {
  act(() => {
    nativeProps(renderer).onBlockOutcome({ nativeEvent: { outcome, reason } })
  })
}

/** The height the layout is given: the slot the block stands in. */
const frameHeight = (renderer: ReactTestRenderer) => {
  const frame = renderer.root.findAllByType(asType(View))[0]
  return StyleSheet.flatten(frame.props.style).height
}

/** The height of the block inside the slot — what the native view is laid out in. */
const insideHeight = (renderer: ReactTestRenderer) => {
  const inside = renderer.root.findAllByType(asType(View))[1]
  return StyleSheet.flatten(inside.props.style).height
}

const placeholderBlock = (props: Partial<React.ComponentProps<typeof MindboxEmbeddedBlock>> = {}) => <MindboxEmbeddedBlock placeSystemName="stories" height={104} loadingStrategy="placeholder" {...props} />

beforeEach(() => {
  firstLook.mockReset()
  holdFirstLook()
})

describe('MindboxEmbeddedBlock', () => {
  it('takes its height while loading and hands it back when the block collapses', () => {
    const renderer = render(placeholderBlock())

    expect(frameHeight(renderer)).toBe(104)

    reportAppearance(renderer, 'collapsed')

    expect(frameHeight(renderer)).toBe(0)
  })

  it('resizes a live block in place when the height changes', () => {
    const renderer = render(placeholderBlock({ height: 160 }))

    update(renderer, placeholderBlock({ height: 80 }))

    expect(frameHeight(renderer)).toBe(80)
    expect(insideHeight(renderer)).toBe(80)
    expect(nativeProps(renderer).blockHeight).toBe(80)
  })

  it('says nothing about space around a name the SDK trims anyway', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(placeholderBlock({ placeSystemName: ' stories ' }))

    update(renderer, placeholderBlock({ placeSystemName: ' stories ' }))

    expect(warn).not.toHaveBeenCalled()
    expect(nativeProps(renderer).placeSystemName).toBe(' stories ')
    warn.mockRestore()
  })

  it('warns once about a place system name that is not there at all', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(placeholderBlock({ placeSystemName: '' }))

    update(renderer, placeholderBlock({ placeSystemName: '' }))

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('without a place system name')
    expect(nativeProps(renderer).placeSystemName).toBe('')
    warn.mockRestore()
  })

  it('calls a name of nothing but spaces a missing name, not a padded one', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(placeholderBlock({ placeSystemName: '   ' }))

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('without a place system name')
    warn.mockRestore()
  })

  it('hands the failure of a nameless place to the host and gives the space back', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const onFail = jest.fn()
    const renderer = render(placeholderBlock({ placeSystemName: '', onFail }))

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
    const renderer = render(placeholderBlock({ height }))

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('reserves no space')
    expect(frameHeight(renderer)).toBe(0)
    expect(nativeProps(renderer).blockHeight).toBe(0)
    warn.mockRestore()
  })

  it('tells the native block the place, the height and whether the place is taken', () => {
    const renderer = render(placeholderBlock({ placeholder: <Text>wait</Text>, active: false }))

    expect(nativeProps(renderer)).toMatchObject({
      placeSystemName: 'stories',
      blockHeight: 104,
      hasPlaceholder: true,
      hasErrorView: false,
      hostVisible: false,
    })
  })

  it('sends zero for a timeout the host did not set', () => {
    const renderer = render(placeholderBlock())

    expect(nativeProps(renderer).timeoutMs).toBe(0)
  })

  it('sends the timeout it was created with, in milliseconds', () => {
    const renderer = render(placeholderBlock({ timeoutMs: 5000 }))

    expect(nativeProps(renderer).timeoutMs).toBe(5000)
  })

  it('keeps the timeout it was created with and warns once about a change', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const renderer = render(placeholderBlock({ timeoutMs: 5000 }))

    update(renderer, placeholderBlock({ timeoutMs: 1000 }))
    update(renderer, placeholderBlock({ timeoutMs: 2000 }))

    expect(nativeProps(renderer).timeoutMs).toBe(5000)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('timeoutMs')
    warn.mockRestore()
  })

  it('draws the host placeholder over the loading block and the host error over the failed one', () => {
    const renderer = render(placeholderBlock({ placeholder: <Text>loading</Text>, error: <Text>broken</Text> }))

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
      const renderer = render(placeholderBlock({ onLoad, onFail }))

      reportOutcome(renderer, 'load')
      reportOutcome(renderer, 'load')

      expect(onLoad).toHaveBeenCalledTimes(1)

      reportOutcome(renderer, 'fail', 'networkError')

      expect(onFail).toHaveBeenCalledTimes(1)
    })

    it('reports an empty place through onEmpty, with the space given back and no reason', () => {
      const onEmpty = jest.fn()
      const onFail = jest.fn()
      const renderer = render(placeholderBlock({ onEmpty, onFail }))

      reportAppearance(renderer, 'collapsed')
      reportOutcome(renderer, 'empty')

      expect(onEmpty).toHaveBeenCalledTimes(1)
      expect(onEmpty).toHaveBeenCalledWith()
      expect(onFail).not.toHaveBeenCalled()
      expect(frameHeight(renderer)).toBe(0)
    })

    it('hands the failure reason to onFail as the native block spelled it', () => {
      const onFail = jest.fn()
      const renderer = render(placeholderBlock({ onFail }))

      reportOutcome(renderer, 'fail', 'networkError')

      expect(onFail).toHaveBeenCalledWith(MindboxEmbeddedBlockFailReason.networkError)
    })

    it('passes a reason it does not know through as it is', () => {
      const onFail = jest.fn()
      const renderer = render(placeholderBlock({ onFail }))

      reportOutcome(renderer, 'fail', 'sideways')

      expect(onFail).toHaveBeenCalledWith('sideways')
    })

    it('calls a failure without a reason an internal error', () => {
      const onFail = jest.fn()
      const renderer = render(placeholderBlock({ onFail }))

      reportOutcome(renderer, 'fail')

      expect(onFail).toHaveBeenCalledWith(MindboxEmbeddedBlockFailReason.internalError)
    })

    it('delivers a failure that repeats with another reason once', () => {
      const onFail = jest.fn()
      const renderer = render(placeholderBlock({ onFail }))

      reportOutcome(renderer, 'fail', 'networkError')
      reportOutcome(renderer, 'fail', 'internalError')

      expect(onFail).toHaveBeenCalledTimes(1)
      expect(onFail).toHaveBeenCalledWith('networkError')
    })

    it('delivers a sequence of outcomes in order, repeats dropped', () => {
      const delivered: Array<string> = []
      const renderer = render(placeholderBlock({ onLoad: () => delivered.push('load'), onEmpty: () => delivered.push('empty'), onFail: (reason) => delivered.push(`fail:${reason}`) }))

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
      const renderer = render(placeholderBlock({ onLoad, onEmpty, onFail }))

      reportOutcome(renderer, 'sideways')

      expect(onLoad).not.toHaveBeenCalled()
      expect(onEmpty).not.toHaveBeenCalled()
      expect(onFail).not.toHaveBeenCalled()
    })

    it('calls the handler the host passed last, not the one it passed first', () => {
      const first = jest.fn()
      const second = jest.fn()
      const renderer = render(placeholderBlock({ onLoad: first }))

      update(renderer, placeholderBlock({ onLoad: second }))
      reportOutcome(renderer, 'load')

      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledTimes(1)
    })
  })

  it('ignores an appearance it does not know, keeping the last known one', () => {
    const renderer = render(placeholderBlock())

    reportAppearance(renderer, 'collapsed')
    reportAppearance(renderer, 'sideways')

    expect(frameHeight(renderer)).toBe(0)
  })

  it('builds a different place as a different block, with nothing remembered', () => {
    const onLoad = jest.fn()
    const renderer = render(placeholderBlock({ onLoad }))

    reportOutcome(renderer, 'load')
    update(renderer, placeholderBlock({ placeSystemName: 'banner', onLoad }))
    reportOutcome(renderer, 'load')

    expect(onLoad).toHaveBeenCalledTimes(2)
  })

  describe('the strategy and the animation flag', () => {
    it('tells the native block the strategy and the flag it was created with', () => {
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} loadingStrategy="hidden" animatesReveal={false} />)

      expect(nativeProps(renderer)).toMatchObject({ loadingStrategy: 'hidden', animatesReveal: false })
    })

    it('starts automatic and animated when the host says nothing', () => {
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} />)

      expect(nativeProps(renderer)).toMatchObject({ loadingStrategy: 'automatic', animatesReveal: true })
    })

    it('names the strategies by the words the native blocks take', () => {
      expect(MindboxEmbeddedBlockLoadingStrategy).toEqual({ automatic: 'automatic', placeholder: 'placeholder', hidden: 'hidden' })
    })

    it('keeps the strategy and the flag it was created with and warns once about each change', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      const renderer = render(placeholderBlock({ animatesReveal: true }))

      update(renderer, <MindboxEmbeddedBlock placeSystemName="stories" height={104} loadingStrategy="hidden" animatesReveal={false} />)
      update(renderer, <MindboxEmbeddedBlock placeSystemName="stories" height={104} loadingStrategy="automatic" animatesReveal={false} />)

      expect(nativeProps(renderer)).toMatchObject({ loadingStrategy: 'placeholder', animatesReveal: true })
      expect(warn).toHaveBeenCalledTimes(2)
      expect(warn.mock.calls[0][0]).toContain('loadingStrategy')
      expect(warn.mock.calls[1][0]).toContain('animatesReveal')
      warn.mockRestore()
    })
  })

  describe('the first look', () => {
    it('gives a placeholder block its height from the first frame and never asks', () => {
      const renderer = render(placeholderBlock({ placeholder: <Text>loading</Text> }))

      expect(frameHeight(renderer)).toBe(104)
      expect(renderer.root.findByType(asType(Text)).props.children).toBe('loading')
      expect(firstLook).not.toHaveBeenCalled()
    })

    it('gives a hidden block no slot while the native view inside keeps the full height', () => {
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} loadingStrategy="hidden" placeholder={<Text>loading</Text>} />)

      expect(frameHeight(renderer)).toBe(0)
      expect(insideHeight(renderer)).toBe(104)
      expect(nativeProps(renderer).blockHeight).toBe(104)
      expect(renderer.root.findAllByType(asType(Text))).toHaveLength(0)
      expect(firstLook).not.toHaveBeenCalled()
    })

    it('asks the native module once what an automatic block starts with', () => {
      render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} />)

      expect(firstLook).toHaveBeenCalledTimes(1)
      expect(firstLook).toHaveBeenCalledWith('stories', 'automatic')
    })

    it('keeps an automatic block at zero until the answer, then shows the placeholder', async () => {
      let answer: (word: string) => void = () => undefined
      firstLook.mockImplementation(() => new Promise<string>((resolve) => (answer = resolve)))
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} placeholder={<Text>loading</Text>} />)

      expect(frameHeight(renderer)).toBe(0)
      expect(renderer.root.findAllByType(asType(Text))).toHaveLength(0)

      answer('placeholder')
      await settle()

      expect(frameHeight(renderer)).toBe(104)
      expect(renderer.root.findByType(asType(Text)).props.children).toBe('loading')
    })

    it('keeps an automatic block at zero after an answer of collapsed', async () => {
      answerFirstLookWith('collapsed')
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} />)

      await settle()

      expect(frameHeight(renderer)).toBe(0)
    })

    it('lets the native block outrank a later answer of the module', async () => {
      let answer: (word: string) => void = () => undefined
      firstLook.mockImplementation(() => new Promise<string>((resolve) => (answer = resolve)))
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} />)

      reportAppearance(renderer, 'content')
      answer('collapsed')
      await settle()

      expect(frameHeight(renderer)).toBe(104)
    })

    it('leaves the block at zero when the module fails, says so once, and waits for the native block', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      forgetFirstLook()
      const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} />)

      await settle()

      expect(frameHeight(renderer)).toBe(0)
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0][0]).toContain('initialAppearance')

      reportAppearance(renderer, 'placeholder')

      expect(frameHeight(renderer)).toBe(104)
      warn.mockRestore()
    })
  })

  describe('the reveal', () => {
    const hiddenBlock = () => <MindboxEmbeddedBlock placeSystemName="stories" height={104} loadingStrategy="hidden" />

    beforeEach(() => {
      jest.useFakeTimers('modern')
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const tick = (ms: number) => {
      act(() => {
        jest.advanceTimersByTime(ms)
      })
    }

    it('grows a block that waited hidden from zero to its height over the SDK reveal', () => {
      const renderer = render(hiddenBlock())

      reportAppearance(renderer, 'content', { animated: true, revealDurationMs: 250 })

      expect(frameHeight(renderer)).toBe(0)

      tick(125)

      expect(frameHeight(renderer)).toBeGreaterThan(30)
      expect(frameHeight(renderer)).toBeLessThan(74)

      tick(125)

      expect(frameHeight(renderer)).toBe(104)
    })

    it('lands at once when the native block does not call the change a reveal', () => {
      const renderer = render(hiddenBlock())

      reportAppearance(renderer, 'content')

      expect(frameHeight(renderer)).toBe(104)
    })

    it('lands at once when the reveal comes without a duration', () => {
      const renderer = render(hiddenBlock())

      reportAppearance(renderer, 'content', { animated: true, revealDurationMs: 0 })

      expect(frameHeight(renderer)).toBe(104)
    })

    it('does not grow content that arrives into a placeholder: the space was taken already', () => {
      const renderer = render(placeholderBlock())

      reportAppearance(renderer, 'content', { animated: true, revealDurationMs: 250 })

      expect(frameHeight(renderer)).toBe(104)

      tick(125)

      expect(frameHeight(renderer)).toBe(104)
    })

    it('collapses at once in the middle of a reveal', () => {
      const renderer = render(hiddenBlock())

      reportAppearance(renderer, 'content', { animated: true, revealDurationMs: 250 })
      tick(125)
      reportAppearance(renderer, 'collapsed')

      expect(frameHeight(renderer)).toBe(0)

      tick(250)

      expect(frameHeight(renderer)).toBe(0)
    })
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
