'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { I18N, LANGS, Lang, createT } from '@/lib/i18n'

type PresetMode = 'grayscale' | 'extract' | 'filter' | null
type AppMode = 'idle' | 'camera' | 'image'

const FILTERS: Record<string, (h: number, s: number, l: number) => [number, number, number]> = {
  retro: (h, s, l) => [
    (h + 12 / 360 + 1) % 1,
    Math.min(s * 0.75, 1),
    l < 0.5 ? l * 0.85 + 0.06 : l * 0.9 + 0.04,
  ],
  pastel: (h, s, l) => [h, Math.min(s * 0.45, 1), l * 0.45 + 0.52],
  neon: (h, s, l) => [h, Math.min(s * 3.0, 1), l < 0.5 ? l * 0.6 : l * 0.7 + 0.28],
  earth: (h, s, l) => {
    const deg = h * 360
    let nh = h
    if (deg >= 180 && deg < 300) nh = ((deg - (deg - 150) * 0.45) / 360 + 1) % 1
    return [nh, Math.min(s * 0.6, 1), l * 0.78 + 0.04]
  },
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

function applyContrast(value: number, delta: number): number {
  const f = (259 * (delta + 255)) / (255 * (259 - delta))
  return Math.max(0, Math.min(255, f * (value - 128) + 128))
}

function boostSaturation(r: number, g: number, b: number, factor: number): [number, number, number] {
  const [h, s, l] = rgbToHsl(r, g, b)
  return hslToRgb(h, Math.min(1, s * factor), l)
}

function nearestPaletteColor(r: number, g: number, b: number, hueWeight: number, palette: string[]): string {
  const [ih, is, il] = rgbToHsl(r, g, b)
  let bestDist = Infinity, bestColor = palette[0]
  for (const hex of palette) {
    const [pr, pg, pb] = hexToRgb(hex)
    const [ph, ps, pl] = rgbToHsl(pr, pg, pb)
    let dh = Math.abs(ih - ph)
    if (dh > 0.5) dh = 1 - dh
    const ds = Math.abs(is - ps), dl = Math.abs(il - pl)
    const dist = hueWeight * dh * dh + (1 - hueWeight) * (0.5 * ds * ds + 0.5 * dl * dl)
    if (dist < bestDist) { bestDist = dist; bestColor = hex }
  }
  return bestColor
}

export default function PixelCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const outputCanvasRef = useRef<HTMLCanvasElement>(null)
  const processCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const animIdRef = useRef<number | null>(null)
  const sourceImageRef = useRef<HTMLImageElement | null>(null)
  const WRef = useRef(320)
  const HRef = useRef(240)
  const runningRef = useRef(false)
  const modeRef = useRef<AppMode>('idle')
  const paletteRef = useRef<string[]>(['#1a1a2e','#16213e','#0f3460','#e94560','#f5a623','#7ed321'])
  const activePresetModeRef = useRef<PresetMode>(null)
  const activePresetNameRef = useRef<string | null>(null)
  const invertedRef = useRef(false)
  const facingModeRef = useRef<'environment' | 'user'>('environment')

  const [lang, setLangState] = useState<Lang>('en')
  const [status, setStatus] = useState('')
  const [palette, setPalette] = useState<string[]>(['#1a1a2e','#16213e','#0f3460','#e94560','#f5a623','#7ed321'])
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [inverted, setInverted] = useState(false)
  const [appMode, setAppMode] = useState<AppMode>('idle')
  const [isRunning, setIsRunning] = useState(false)
  const [saveReady, setSaveReady] = useState(false)
  const [pixelSize, setPixelSize] = useState(1)
  const [contrast, setContrast] = useState(100)
  const [hueSensitivity, setHueSensitivity] = useState(70)
  const [satBoost, setSatBoost] = useState(120)
  const [extractCount, setExtractCount] = useState(6)

  const t = useCallback((key: Parameters<ReturnType<typeof createT>>[0], arg?: number) => {
    return createT(lang)(key, arg)
  }, [lang])

  // Sync refs with state for use inside canvas loops
  useEffect(() => { paletteRef.current = palette }, [palette])
  useEffect(() => { invertedRef.current = inverted }, [inverted])

  useEffect(() => {
    const urlLang = new URLSearchParams(window.location.search).get('lang') as Lang | null
    const browserLang = (navigator.language || 'en').slice(0, 2) as Lang
    const detected = urlLang && LANGS.includes(urlLang) ? urlLang : LANGS.includes(browserLang) ? browserLang : 'en'
    setLangState(detected)
    setStatus(I18N[detected].statusInit)
  }, [])

  useEffect(() => {
    setStatus(t('statusInit'))
  }, [lang, t])

  const pixelate = useCallback((source: HTMLVideoElement | HTMLImageElement) => {
    const out = outputCanvasRef.current
    const proc = processCanvasRef.current
    if (!out || !proc) return
    const ctx = out.getContext('2d')!
    const pCtx = proc.getContext('2d')!
    const W = WRef.current, H = HRef.current
    const contrastDelta = contrast - 100
    const hueWeight = hueSensitivity / 100
    const satFactor = satBoost / 100

    pCtx.drawImage(source, 0, 0, W, H)
    const imageData = pCtx.getImageData(0, 0, W, H)
    const data = imageData.data

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    const pal = paletteRef.current
    const presetMode = activePresetModeRef.current
    const presetName = activePresetNameRef.current

    for (let y = 0; y < H; y += pixelSize) {
      for (let x = 0; x < W; x += pixelSize) {
        const endX = Math.min(x + pixelSize, W)
        const endY = Math.min(y + pixelSize, H)
        let sumR = 0, sumG = 0, sumB = 0, count = 0
        for (let py = y; py < endY; py++) {
          for (let px = x; px < endX; px++) {
            const idx = (py * W + px) * 4
            sumR += data[idx]; sumG += data[idx + 1]; sumB += data[idx + 2]
            count++
          }
        }
        let cr = applyContrast(sumR / count, contrastDelta)
        let cg = applyContrast(sumG / count, contrastDelta)
        let cb = applyContrast(sumB / count, contrastDelta);
        [cr, cg, cb] = boostSaturation(cr, cg, cb, satFactor)

        const colorHex = nearestPaletteColor(cr, cg, cb, hueWeight, pal)
        let [fr, fg, fb] = hexToRgb(colorHex)
        if (presetMode === 'filter' && presetName && FILTERS[presetName]) {
          let [h, s, l] = rgbToHsl(fr, fg, fb);
          [h, s, l] = FILTERS[presetName](h, s, l);
          [fr, fg, fb] = hslToRgb(h, s, l)
        }
        if (invertedRef.current) { fr = 255 - fr; fg = 255 - fg; fb = 255 - fb }
        ctx.fillStyle = `rgb(${fr},${fg},${fb})`
        ctx.fillRect(x, y, endX - x, endY - y)
      }
    }
  }, [pixelSize, contrast, hueSensitivity, satBoost])

  const renderStatic = useCallback(() => {
    if (!sourceImageRef.current) return
    pixelate(sourceImageRef.current)
  }, [pixelate])

  // Re-render on slider change when in image mode
  useEffect(() => {
    if (modeRef.current === 'image') renderStatic()
  }, [pixelSize, contrast, hueSensitivity, satBoost, renderStatic])

  const extractPaletteFromFrame = useCallback((k?: number) => {
    const count = k ?? extractCount
    const video = videoRef.current
    const proc = processCanvasRef.current
    if (!proc) return
    if (!runningRef.current && modeRef.current !== 'image') {
      setStatus(createT(lang)('statusNoSource'))
      return
    }
    setStatus(createT(lang)('statusAnalyzing'))
    const pCtx = proc.getContext('2d')!
    const W = WRef.current, H = HRef.current
    const src = modeRef.current === 'image' ? sourceImageRef.current! : video!
    pCtx.drawImage(src, 0, 0, W, H)
    const data = pCtx.getImageData(0, 0, W, H).data

    const samples: [number, number, number][] = []
    for (let i = 0; i < data.length; i += 4 * 4) {
      samples.push([data[i], data[i + 1], data[i + 2]])
    }

    const centroids: [number, number, number][] = []
    centroids.push(samples[Math.floor(Math.random() * samples.length)])
    for (let c = 1; c < count; c++) {
      const dists = samples.map(p => {
        let minD = Infinity
        for (const cen of centroids) {
          const d = (p[0]-cen[0])**2 + (p[1]-cen[1])**2 + (p[2]-cen[2])**2
          if (d < minD) minD = d
        }
        return minD
      })
      const total = dists.reduce((a, b) => a + b, 0)
      let r = Math.random() * total
      for (let i = 0; i < dists.length; i++) {
        r -= dists[i]
        if (r <= 0) { centroids.push(samples[i]); break }
      }
      if (centroids.length < c + 1) centroids.push(samples[0])
    }

    let iter = 0
    const MAX_ITER = 20

    const kmeansStep = () => {
      const clusters: [number, number, number][][] = Array.from({ length: count }, () => [])
      for (const p of samples) {
        let best = 0, bestD = Infinity
        for (let c = 0; c < count; c++) {
          const d = (p[0]-centroids[c][0])**2 + (p[1]-centroids[c][1])**2 + (p[2]-centroids[c][2])**2
          if (d < bestD) { bestD = d; best = c }
        }
        clusters[best].push(p)
      }
      let moved = false
      for (let c = 0; c < count; c++) {
        if (clusters[c].length === 0) continue
        const nr = clusters[c].reduce((s, p) => s + p[0], 0) / clusters[c].length
        const ng = clusters[c].reduce((s, p) => s + p[1], 0) / clusters[c].length
        const nb = clusters[c].reduce((s, p) => s + p[2], 0) / clusters[c].length
        if (Math.abs(nr - centroids[c][0]) + Math.abs(ng - centroids[c][1]) + Math.abs(nb - centroids[c][2]) > 0.5) moved = true
        centroids[c] = [nr, ng, nb]
      }
      iter++
      if (moved && iter < MAX_ITER) {
        setTimeout(kmeansStep, 0)
      } else {
        centroids.sort((a, b) => (0.299*a[0]+0.587*a[1]+0.114*a[2]) - (0.299*b[0]+0.587*b[1]+0.114*b[2]))
        const newPalette = centroids.map(([r, g, b]) => {
          const h = (v: number) => Math.round(v).toString(16).padStart(2, '0')
          return '#' + h(r) + h(g) + h(b)
        })
        paletteRef.current = newPalette
        setPalette(newPalette)
        if (modeRef.current === 'image' && sourceImageRef.current) {
          setTimeout(() => pixelate(sourceImageRef.current!), 0)
        }
        setStatus(createT(lang)('statusExtracted', count))
      }
    }
    setTimeout(kmeansStep, 0)
  }, [extractCount, lang, pixelate])

  const applyGrayscale = useCallback((n?: number) => {
    const count = n ?? extractCount
    activePresetModeRef.current = 'grayscale'
    setActivePreset('preset-grayscale')
    const newPalette = Array.from({ length: count }, (_, i) => {
      const v = Math.round(i / (count - 1) * 255)
      const h = v.toString(16).padStart(2, '0')
      return '#' + h + h + h
    })
    paletteRef.current = newPalette
    setPalette(newPalette)
    if (modeRef.current === 'image' && sourceImageRef.current) {
      setTimeout(() => pixelate(sourceImageRef.current!), 0)
    }
  }, [extractCount, pixelate])

  const applyBasicExtract = useCallback(() => {
    activePresetModeRef.current = 'extract'
    setActivePreset('preset-extract')
    extractPaletteFromFrame()
  }, [extractPaletteFromFrame])

  const applyPreset = useCallback((name: string) => {
    activePresetModeRef.current = 'filter'
    activePresetNameRef.current = name
    setActivePreset('preset-' + name)
    extractPaletteFromFrame()
  }, [extractPaletteFromFrame])

  // Handle extractCount change reactively
  const handleExtractCountChange = useCallback((val: number) => {
    setExtractCount(val)
    const mode = activePresetModeRef.current
    if (mode === 'grayscale') {
      applyGrayscale(val)
    } else if (mode === 'extract' || mode === 'filter') {
      extractPaletteFromFrame(val)
    }
  }, [applyGrayscale, extractPaletteFromFrame])

  const render = useCallback(() => {
    if (!runningRef.current || !videoRef.current) return
    pixelate(videoRef.current)
    animIdRef.current = requestAnimationFrame(render)
  }, [pixelate])

  const stopCamera = useCallback(() => {
    runningRef.current = false
    modeRef.current = 'idle'
    setAppMode('idle')
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
    const video = videoRef.current
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      video.srcObject = null
    }
    setIsRunning(false)
    setSaveReady(false)
    setStatus(createT(lang)('statusStopped'))
  }, [lang])

  const startCamera = useCallback(async () => {
    try {
      setStatus(createT(lang)('statusConnecting'))
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: facingModeRef.current },
      })
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      runningRef.current = true
      modeRef.current = 'camera'
      sourceImageRef.current = null
      WRef.current = 320; HRef.current = 240
      const out = outputCanvasRef.current!
      const proc = processCanvasRef.current!
      out.width = 320; out.height = 240
      proc.width = 320; proc.height = 240
      const area = document.getElementById('canvasArea')
      if (area) area.style.aspectRatio = '4 / 3'
      setIsRunning(true)
      setSaveReady(true)
      setAppMode('camera')
      setStatus(createT(lang)('statusLive'))
      render()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setStatus(createT(lang)('statusAccessFail') + msg)
    }
  }, [lang, render])

  const flipCamera = useCallback(async () => {
    facingModeRef.current = facingModeRef.current === 'environment' ? 'user' : 'environment'
    if (runningRef.current) { stopCamera(); await startCamera() }
  }, [stopCamera, startCamera])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (runningRef.current) stopCamera()

    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        sourceImageRef.current = img
        modeRef.current = 'image'
        const maxW = 640
        const scale = Math.min(1, maxW / img.width)
        WRef.current = Math.round(img.width * scale)
        HRef.current = Math.round(img.height * scale)
        const out = outputCanvasRef.current!
        const proc = processCanvasRef.current!
        out.width = WRef.current; out.height = HRef.current
        proc.width = WRef.current; proc.height = HRef.current
        const area = document.getElementById('canvasArea')
        if (area) area.style.aspectRatio = `${WRef.current} / ${HRef.current}`
        setStatus(createT(lang)('statusLoaded'))
        setSaveReady(true)
        setAppMode('image')
        pixelate(img)
        activePresetModeRef.current = 'extract'
        setActivePreset('preset-extract')
        extractPaletteFromFrame()
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [lang, stopCamera, pixelate, extractPaletteFromFrame])

  const saveImage = useCallback(() => {
    if (!saveReady) return
    const canvas = outputCanvasRef.current
    if (!canvas) return
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `pixmo-${Date.now()}.png`
    link.href = dataURL
    if (typeof link.download !== 'undefined' && !/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      window.open(dataURL, '_blank')
    }
  }, [saveReady])

  const updatePaletteColor = useCallback((i: number, color: string) => {
    setPalette(prev => {
      const next = [...prev]
      next[i] = color
      paletteRef.current = next
      if (modeRef.current === 'image' && sourceImageRef.current) pixelate(sourceImageRef.current)
      return next
    })
  }, [pixelate])

  const removePaletteColor = useCallback((i: number) => {
    setPalette(prev => {
      if (prev.length <= 2) return prev
      const next = prev.filter((_, idx) => idx !== i)
      paletteRef.current = next
      if (modeRef.current === 'image' && sourceImageRef.current) pixelate(sourceImageRef.current)
      return next
    })
  }, [pixelate])

  const addPaletteColor = useCallback(() => {
    setPalette(prev => {
      if (prev.length >= 12) return prev
      const next = [...prev, '#ffffff']
      paletteRef.current = next
      if (modeRef.current === 'image' && sourceImageRef.current) pixelate(sourceImageRef.current)
      return next
    })
  }, [pixelate])

  return (
    <>
      {/* Header */}
      <div className="header">
        <h1>PIXMO</h1>
        <span className="status">{status}</span>
        <select
          className="lang-select"
          value={lang}
          onChange={e => setLangState(e.target.value as Lang)}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="pt">Português</option>
        </select>
      </div>

      {/* Ad: header */}
      <div className="ad-banner ad-header">advertisement</div>

      {/* Canvas */}
      <div className="canvas-area" id="canvasArea">
        <video ref={videoRef} autoPlay muted playsInline />
        <canvas ref={outputCanvasRef} id="outputCanvas" />

        {/* Empty state — shown only when idle */}
        {appMode === 'idle' && (
          <div className="empty-state">
            {/* Pixel art camera icon */}
            <div className="empty-pixel-icon">
              {[
                0,0,0,0,0,0,0,0,
                0,0,1,1,1,1,0,0,
                0,1,1,2,2,1,1,0,
                0,1,2,2,2,2,1,0,
                0,1,1,2,2,1,1,0,
                0,0,1,1,1,1,0,0,
              ].map((v, i) => (
                <span key={i} style={{
                  background: v === 2 ? '#555' : v === 1 ? '#333' : 'transparent'
                }} />
              ))}
            </div>

            <p className="empty-hint">{t('emptyHint')}</p>

            <div className="empty-actions">
              <button className="empty-btn empty-btn-primary" onClick={() => fileInputRef.current?.click()}>
                📁 {t('btnLoad')}
              </button>
              <div className="empty-divider">or</div>
              <button className="empty-btn empty-btn-secondary" onClick={startCamera}>
                📷 {t('emptyCam')}
              </button>
            </div>
          </div>
        )}

        <div className="canvas-overlay">
          <button className="overlay-btn flip-btn" onClick={flipCamera}>⇄</button>
          <button
            className="overlay-btn invert-btn"
            style={{ color: inverted ? '#fff' : '#ccc', borderColor: inverted ? '#aaa' : '#333' }}
            onClick={() => { setInverted(v => { invertedRef.current = !v; return !v }) }}
          >INV</button>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        {/* Settings */}
        <div>
          <div className="section-title">{t('secSettings')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="slider-row">
              <label>{t('labelPixel')}</label>
              <input type="range" min={1} max={32} value={pixelSize}
                onChange={e => setPixelSize(Number(e.target.value))} />
              <span className="slider-val">{pixelSize}</span>
            </div>
            <div className="slider-row">
              <label>{t('labelContrast')}</label>
              <input type="range" min={0} max={200} value={contrast}
                onChange={e => setContrast(Number(e.target.value))} />
              <span className="slider-val">{contrast}</span>
            </div>
          </div>
        </div>

        {/* Ad: infeed */}
        <div className="ad-banner ad-infeed">advertisement</div>

        {/* Palette */}
        <div>
          <div className="section-title">{t('secPalette')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Swatches */}
            <div className="palette-swatches">
              {palette.map((color, i) => (
                <div key={i} className="swatch-wrap">
                  <div className="swatch" style={{ background: color }}>
                    <input type="color" value={color}
                      onChange={e => updatePaletteColor(i, e.target.value)} />
                  </div>
                  <button className="swatch-del" onClick={() => removePaletteColor(i)}>✕</button>
                </div>
              ))}
              <button className="add-swatch-btn" onClick={addPaletteColor}>+</button>
            </div>

            {/* Presets */}
            <div className="preset-row">
              {[
                { id: 'preset-extract', label: t('presetBasic'), onClick: applyBasicExtract },
                { id: 'preset-grayscale', label: t('presetBW'), onClick: () => applyGrayscale() },
                { id: 'preset-retro', label: t('presetRetro'), onClick: () => applyPreset('retro') },
                { id: 'preset-pastel', label: t('presetPastel'), onClick: () => applyPreset('pastel') },
                { id: 'preset-neon', label: t('presetNeon'), onClick: () => applyPreset('neon') },
                { id: 'preset-earth', label: t('presetEarth'), onClick: () => applyPreset('earth') },
              ].map(({ id, label, onClick }) => (
                <button
                  key={id}
                  className={`preset-btn${activePreset === id ? ' active' : ''}`}
                  onClick={onClick}
                >{label}</button>
              ))}
            </div>

            {/* Color count + sliders */}
            <div className="slider-row">
              <label>{t('labelColors')}</label>
              <input type="range" min={2} max={25} value={extractCount}
                onChange={e => handleExtractCountChange(Number(e.target.value))} />
              <span className="slider-val">{extractCount}</span>
            </div>
            <div className="slider-row">
              <label>{t('labelHue')}</label>
              <input type="range" min={0} max={100} value={hueSensitivity}
                onChange={e => setHueSensitivity(Number(e.target.value))} />
              <span className="slider-val">{hueSensitivity}</span>
            </div>
            <div className="slider-row">
              <label>{t('labelSat')}</label>
              <input type="range" min={0} max={200} value={satBoost}
                onChange={e => setSatBoost(Number(e.target.value))} />
              <span className="slider-val">{satBoost}</span>
            </div>
          </div>
        </div>

        {/* Ad: sidebar */}
        <div className="ad-banner ad-sidebar">advertisement</div>
      </div>

      {/* Bottom bar */}
      <div className="bottom-bar">
        <button className="btn-main file-btn" onClick={() => fileInputRef.current?.click()}>
          {t('btnLoad')}
        </button>
        <button
          className={`btn-main start-btn${isRunning ? ' running' : ''}`}
          onClick={isRunning ? stopCamera : startCamera}
        >
          {isRunning ? t('btnStop') : '📷'}
        </button>
        <button className={`btn-main save-btn${saveReady ? ' ready' : ''}`} onClick={saveImage}>
          💾
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={handleFileChange} />
      <canvas ref={processCanvasRef} style={{ display: 'none' }} />
    </>
  )
}
