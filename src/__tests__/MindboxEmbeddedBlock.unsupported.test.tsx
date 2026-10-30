import React from 'react'
import { StyleSheet, View } from 'react-native'
import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

// `Platform.OS` is read when the component module loads, so it is mocked before the require below.
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: (specifics: Record<string, unknown>) => specifics.default,
}))

jest.mock('../MindboxEmbeddedBlockNativeComponent', () => {
  const ReactActual = require('react')
  const { View: RNView } = require('react-native')
  return {
    __esModule: true,
    default: (props: unknown) => ReactActual.createElement(RNView, { ...(props as object), testID: 'native-block' }),
  }
})

const { MindboxEmbeddedBlock } = require('../MindboxEmbeddedBlock')

const render = (element: React.ReactElement<any>): ReactTestRenderer => {
  let renderer: ReactTestRenderer
  act(() => {
    renderer = create(element as any)
  })
  return renderer!
}

const slotHeight = (renderer: ReactTestRenderer) => {
  const frame = renderer.root.findAllByType(View as any)[0]
  return StyleSheet.flatten(frame.props.style).height
}

describe('MindboxEmbeddedBlock on a platform without the native block', () => {
  it('takes no space, builds no native view and reports an internal error', () => {
    const onLoad = jest.fn()
    const onEmpty = jest.fn()
    const onFail = jest.fn()
    const renderer = render(<MindboxEmbeddedBlock placeSystemName="stories" height={104} onLoad={onLoad} onEmpty={onEmpty} onFail={onFail} />)

    expect(slotHeight(renderer)).toBe(0)
    expect(renderer.root.findAllByProps({ testID: 'native-block' })).toHaveLength(0)
    expect(onFail).toHaveBeenCalledTimes(1)
    expect(onFail).toHaveBeenCalledWith('internalError')
    expect(onLoad).not.toHaveBeenCalled()
    expect(onEmpty).not.toHaveBeenCalled()
  })
})
