// Sonauto API 反向代理 Worker - 進階版
// 包含完整日誌、路由轉換、超時控制等功能

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// 配置常量
const CONFIG = {
  TARGET_API: 'https://api.sonauto.ai',
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 秒超時
}

// API 端點映射
const ENDPOINTS = {
  '/generate': '/v1/generations',
  '/status': '/v1/generations/',
  '/extend': '/v1/extend',
  '/inpaint': '/v1/inpaint'
}

async function handleRequest(request) {
  // CORS 預檢
  if (request.method === 'OPTIONS') {
    return handleCORS()
  }

  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    let pathname = url.pathname
    
    // 端點路由轉換
    for (const [key, value] of Object.entries(ENDPOINTS)) {
      if (pathname.startsWith(key)) {
        pathname = pathname.replace(key, value)
        break
      }
    }
    
    // 構建完整目標 URL
    const targetUrl = `${CONFIG.TARGET_API}${pathname}${url.search}`
    
    console.log(`[請求] ${request.method} ${targetUrl}`)
    
    // 準備請求頭
    const headers = new Headers()
    
    // 複製必要的請求頭
    for (const [key, value] of request.headers.entries()) {
      if (!['host', 'cf-connecting-ip', 'cf-ray'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    }
    
    // 設置必要頭部
    headers.set('Host', 'api.sonauto.ai')
    headers.set('Origin', 'https://api.sonauto.ai')
    headers.set('Referer', 'https://api.sonauto.ai/')
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    // API Key 處理
    let apiKey = headers.get('X-API-Key') || headers.get('Authorization')
    
    // 如果環境變量中有 API Key,使用它
    if (typeof SONAUTO_API_KEY !== 'undefined' && SONAUTO_API_KEY) {
      apiKey = SONAUTO_API_KEY
    }
    
    if (apiKey) {
      // 確保格式正確
      if (!apiKey.startsWith('Bearer ')) {
        apiKey = `Bearer ${apiKey}`
      }
      headers.set('Authorization', apiKey)
    }
    
    // 移除 X-API-Key(已轉換為 Authorization)
    headers.delete('X-API-Key')
    
    // 準備請求體
    let body = null
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer()
    }
    
    // 發送請求(帶超時)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT)
    
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // 讀取響應
    const responseBody = await response.arrayBuffer()
    const duration = Date.now() - startTime
    
    console.log(`[響應] ${response.status} - 耗時 ${duration}ms`)
    
    // 構建新響應
    const newResponse = new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
    
    // 添加 CORS 頭
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    newResponse.headers.set('Access-Control-Allow-Headers', '*')
    newResponse.headers.set('Access-Control-Expose-Headers', '*')
    
    // 添加自定義頭部
    newResponse.headers.set('X-Proxy-By', 'Sonauto-CF-Worker')
    newResponse.headers.set('X-Response-Time', `${duration}ms`)
    
    return newResponse
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    console.error(`[錯誤] ${error.message} - 耗時 ${duration}ms`)
    
    return new Response(JSON.stringify({
      error: true,
      message: error.name === 'AbortError' ? '請求超時' : error.message,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    }), {
      status: error.name === 'AbortError' ? 504 : 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Proxy-By': 'Sonauto-CF-Worker'
      }
    })
  }
}

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true'
    }
  })
}