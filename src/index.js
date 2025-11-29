// Sonauto API 反向代理 Worker - 基礎版
// 支持音樂生成、擴展、Inpaint 等功能

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 處理 CORS 預檢請求
  if (request.method === 'OPTIONS') {
    return handleCORS()
  }

  try {
    const url = new URL(request.url)
    
    // 構建目標 API URL
    const targetUrl = 'https://api.sonauto.ai' + url.pathname + url.search
    
    // 準備請求頭
    const headers = new Headers(request.headers)
    headers.set('Host', 'api.sonauto.ai')
    headers.set('Origin', 'https://api.sonauto.ai')
    headers.set('Referer', 'https://api.sonauto.ai/')
    
    // 從環境變量或請求頭獲取 API Key
    const apiKey = request.headers.get('X-API-Key') || SONAUTO_API_KEY
    if (apiKey) {
      headers.set('Authorization', `Bearer ${apiKey}`)
    }
    
    // 轉發請求
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? request.body 
        : null
    })
    
    // 處理響應
    const newResponse = new Response(response.body, response)
    
    // 添加 CORS 頭
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    newResponse.headers.set('Access-Control-Allow-Headers', '*')
    
    return newResponse
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: '請求失敗',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400'
    }
  })
}