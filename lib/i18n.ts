export const LANGS = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'pt'] as const
export type Lang = (typeof LANGS)[number]

type StringEntry = string
type FnEntry = (k: number) => string
type DictEntry = StringEntry | FnEntry

interface Dict {
  statusInit: string
  secSettings: string
  secPalette: string
  labelPixel: string
  labelContrast: string
  labelColors: string
  labelHue: string
  labelSat: string
  presetBasic: string
  presetBW: string
  presetRetro: string
  presetPastel: string
  presetNeon: string
  presetEarth: string
  btnLoad: string
  statusConnecting: string
  statusLive: string
  statusStopped: string
  statusAccessFail: string
  statusLoaded: string
  statusAnalyzing: string
  statusExtracted: FnEntry
  statusNoSource: string
  btnStop: string
}

export const I18N: Record<Lang, Dict> = {
  ko: {
    statusInit: '사진을 불러오세요',
    secSettings: '설정', secPalette: '팔레트',
    labelPixel: '픽셀 크기', labelContrast: '대비',
    labelColors: '색 수', labelHue: '색조 감도', labelSat: '채도 부스트',
    presetBasic: '기본', presetBW: '흑백', presetRetro: '레트로',
    presetPastel: '파스텔', presetNeon: '네온', presetEarth: '어스톤',
    btnLoad: '사진 불러오기',
    statusConnecting: '카메라 연결 중...', statusLive: '실시간 처리 중',
    statusStopped: '정지됨', statusAccessFail: '접근 실패: ',
    statusLoaded: '사진 로드됨 — 팔레트 추출 중...', statusAnalyzing: '팔레트 분석 중...',
    statusExtracted: (k) => `${k}색 추출 완료`, statusNoSource: '카메라 또는 사진을 먼저 불러오세요',
    btnStop: '■ 정지',
  },
  en: {
    statusInit: 'Load a photo',
    secSettings: 'Settings', secPalette: 'Palette',
    labelPixel: 'Pixel Size', labelContrast: 'Contrast',
    labelColors: 'Colors', labelHue: 'Hue Sensitivity', labelSat: 'Sat Boost',
    presetBasic: 'Auto', presetBW: 'B&W', presetRetro: 'Retro',
    presetPastel: 'Pastel', presetNeon: 'Neon', presetEarth: 'Earth',
    btnLoad: 'Load Photo',
    statusConnecting: 'Connecting camera...', statusLive: 'Live',
    statusStopped: 'Stopped', statusAccessFail: 'Access denied: ',
    statusLoaded: 'Photo loaded — extracting palette...', statusAnalyzing: 'Analyzing...',
    statusExtracted: (k) => `${k} colors extracted`, statusNoSource: 'Load a photo or start camera first',
    btnStop: '■ Stop',
  },
  ja: {
    statusInit: '写真を読み込む',
    secSettings: '設定', secPalette: 'パレット',
    labelPixel: 'ピクセル', labelContrast: 'コントラスト',
    labelColors: '色数', labelHue: '色相感度', labelSat: '彩度ブースト',
    presetBasic: '自動', presetBW: '白黒', presetRetro: 'レトロ',
    presetPastel: 'パステル', presetNeon: 'ネオン', presetEarth: 'アース',
    btnLoad: '写真を開く',
    statusConnecting: 'カメラ接続中...', statusLive: 'ライブ',
    statusStopped: '停止', statusAccessFail: 'アクセス失敗: ',
    statusLoaded: '読込完了 — パレット抽出中...', statusAnalyzing: '解析中...',
    statusExtracted: (k) => `${k}色抽出完了`, statusNoSource: '写真またはカメラを先に起動してください',
    btnStop: '■ 停止',
  },
  zh: {
    statusInit: '请加载图片',
    secSettings: '设置', secPalette: '调色板',
    labelPixel: '像素大小', labelContrast: '对比度',
    labelColors: '颜色数', labelHue: '色相灵敏度', labelSat: '饱和度',
    presetBasic: '自动', presetBW: '黑白', presetRetro: '复古',
    presetPastel: '粉彩', presetNeon: '霓虹', presetEarth: '大地',
    btnLoad: '加载图片',
    statusConnecting: '连接摄像头...', statusLive: '实时处理中',
    statusStopped: '已停止', statusAccessFail: '访问失败: ',
    statusLoaded: '图片已加载 — 提取调色板...', statusAnalyzing: '分析中...',
    statusExtracted: (k) => `已提取${k}种颜色`, statusNoSource: '请先加载图片或启动摄像头',
    btnStop: '■ 停止',
  },
  es: {
    statusInit: 'Carga una foto',
    secSettings: 'Ajustes', secPalette: 'Paleta',
    labelPixel: 'Tamaño pixel', labelContrast: 'Contraste',
    labelColors: 'Colores', labelHue: 'Sensib. tono', labelSat: 'Saturación',
    presetBasic: 'Auto', presetBW: 'B/N', presetRetro: 'Retro',
    presetPastel: 'Pastel', presetNeon: 'Neón', presetEarth: 'Tierra',
    btnLoad: 'Cargar foto',
    statusConnecting: 'Conectando cámara...', statusLive: 'En vivo',
    statusStopped: 'Detenido', statusAccessFail: 'Acceso denegado: ',
    statusLoaded: 'Foto cargada — extrayendo paleta...', statusAnalyzing: 'Analizando...',
    statusExtracted: (k) => `${k} colores extraídos`, statusNoSource: 'Carga una foto o inicia la cámara',
    btnStop: '■ Parar',
  },
  fr: {
    statusInit: 'Charger une photo',
    secSettings: 'Réglages', secPalette: 'Palette',
    labelPixel: 'Taille pixel', labelContrast: 'Contraste',
    labelColors: 'Couleurs', labelHue: 'Sensib. teinte', labelSat: 'Saturation',
    presetBasic: 'Auto', presetBW: 'N&B', presetRetro: 'Rétro',
    presetPastel: 'Pastel', presetNeon: 'Néon', presetEarth: 'Terre',
    btnLoad: 'Charger photo',
    statusConnecting: 'Connexion caméra...', statusLive: 'En direct',
    statusStopped: 'Arrêté', statusAccessFail: 'Accès refusé : ',
    statusLoaded: 'Photo chargée — extraction palette...', statusAnalyzing: 'Analyse...',
    statusExtracted: (k) => `${k} couleurs extraites`, statusNoSource: 'Chargez une photo ou démarrez la caméra',
    btnStop: '■ Arrêter',
  },
  de: {
    statusInit: 'Foto laden',
    secSettings: 'Einstellungen', secPalette: 'Palette',
    labelPixel: 'Pixelgröße', labelContrast: 'Kontrast',
    labelColors: 'Farben', labelHue: 'Farbton', labelSat: 'Sättigung',
    presetBasic: 'Auto', presetBW: 'S/W', presetRetro: 'Retro',
    presetPastel: 'Pastell', presetNeon: 'Neon', presetEarth: 'Erde',
    btnLoad: 'Foto laden',
    statusConnecting: 'Kamera verbinden...', statusLive: 'Live',
    statusStopped: 'Gestoppt', statusAccessFail: 'Zugriff verweigert: ',
    statusLoaded: 'Foto geladen — Palette wird extrahiert...', statusAnalyzing: 'Analysiere...',
    statusExtracted: (k) => `${k} Farben extrahiert`, statusNoSource: 'Bitte zuerst Foto laden oder Kamera starten',
    btnStop: '■ Stopp',
  },
  pt: {
    statusInit: 'Carregar foto',
    secSettings: 'Ajustes', secPalette: 'Paleta',
    labelPixel: 'Tamanho pixel', labelContrast: 'Contraste',
    labelColors: 'Cores', labelHue: 'Sensib. matiz', labelSat: 'Saturação',
    presetBasic: 'Auto', presetBW: 'P&B', presetRetro: 'Retrô',
    presetPastel: 'Pastel', presetNeon: 'Neon', presetEarth: 'Terra',
    btnLoad: 'Carregar foto',
    statusConnecting: 'Conectando câmera...', statusLive: 'Ao vivo',
    statusStopped: 'Parado', statusAccessFail: 'Acesso negado: ',
    statusLoaded: 'Foto carregada — extraindo paleta...', statusAnalyzing: 'Analisando...',
    statusExtracted: (k) => `${k} cores extraídas`, statusNoSource: 'Carregue uma foto ou inicie a câmera',
    btnStop: '■ Parar',
  },
}

export function createT(lang: Lang) {
  const dict = I18N[lang]
  return function t(key: keyof Dict, arg?: number): string {
    const v = dict[key]
    if (typeof v === 'function') return v(arg ?? 0)
    return v
  }
}
