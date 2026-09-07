import React from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'

/**
 * TEMPORARY — a local stand-in for the SDK block, drawn while `useLocalTestBanner` is on.
 *
 * A WebView with inline HTML: a colourful banner of the same height the real block would take,
 * reporting `onLoad` the way the block does, with a clock counting the seconds since the page loaded —
 * a page that survives a navigation keeps counting, a page loaded again starts over. Nothing here
 * talks to the SDK. Delete this file and the flag once the real place is configured.
 */
type Props = {
  height: number
  onLoad?: () => void
}

const html = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html, body { margin: 0; height: 100%; background: transparent; font-family: -apple-system, Helvetica, Arial, sans-serif; }
  .banner {
    height: 100%; box-sizing: border-box; padding: 18px 20px; border-radius: 16px; color: #fff;
    background: linear-gradient(120deg, #ff5f6d 0%, #ffc371 35%, #47c9ff 70%, #7b5cff 100%);
    background-size: 220% 220%; animation: drift 7s ease-in-out infinite alternate;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  @keyframes drift { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
  .tag { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; opacity: .85; }
  .title { font-size: 22px; font-weight: 700; line-height: 1.15; text-shadow: 0 1px 2px rgba(0,0,0,.15); }
  .row { display: flex; justify-content: space-between; align-items: flex-end; }
  .cta { background: rgba(255,255,255,.92); color: #333; border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 600; }
  .dots span { display: inline-block; width: 6px; height: 6px; border-radius: 3px; background: rgba(255,255,255,.6); margin-right: 5px; }
  .dots span:first-child { background: #fff; }
  .clock { position: absolute; top: 14px; right: 18px; font-size: 12px; font-variant-numeric: tabular-nums; opacity: .85; }
  .banner { position: relative; }
</style>
</head>
<body>
  <div class="banner">
    <div class="tag">Embedded block · local test</div>
    <div class="clock"><span id="clock">0</span> s alive</div>
    <div class="title">A colourful banner<br>standing in for the SDK</div>
    <div class="row">
      <div class="dots"><span></span><span></span><span></span></div>
      <div class="cta">Open</div>
    </div>
  </div>
<script>
  // The page's own clock: it counts from the moment the page was loaded. Back at zero after a
  // navigation means the page was loaded again — the block was rebuilt, not paused.
  var started = Date.now();
  setInterval(function () { document.getElementById('clock').textContent = Math.round((Date.now() - started) / 1000); }, 1000);
</script>
</body>
</html>`

export const LocalTestBanner = ({ height, onLoad }: Props) => (
  <View style={[styles.frame, { height }]}>
    <WebView source={{ html }} originWhitelist={['*']} scrollEnabled={false} style={styles.web} containerStyle={styles.web} onLoadEnd={onLoad} />
  </View>
)

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  web: {
    backgroundColor: 'transparent',
  },
})
