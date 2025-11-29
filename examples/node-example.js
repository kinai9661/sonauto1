// Node.js 使用示例
// 需要安裝: npm install node-fetch

const fetch = require('node-fetch')

// 配置
const WORKER_URL = 'https://your-worker.workers.dev'

// 生成音樂
async function generateMusic() {
  try {
    const response = await fetch(`${WORKER_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: ['流行', '抒情'],
        prompt: '一首溫柔的情歌',
        lyrics: '在這個寂靜的夜晚\\n我想起了你的笑容...',
        duration: 90
      })
    })

    const data = await response.json()
    console.log('生成成功!')
    console.log('生成ID:', data.id)
    
    return data.id
  } catch (error) {
    console.error('生成失敗:', error.message)
    throw error
  }
}

// 查詢狀態
async function checkStatus(generationId) {
  try {
    const response = await fetch(`${WORKER_URL}/status/${generationId}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('查詢失敗:', error.message)
    throw error
  }
}

// 輪詢直到完成
async function waitForCompletion(generationId, maxAttempts = 60) {
  console.log('等待生成完成...')
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkStatus(generationId)
    
    console.log(`[${i + 1}/${maxAttempts}] 狀態: ${status.status}`)
    
    if (status.status === 'completed') {
      console.log('✅ 生成完成!')
      console.log('音頻URL:', status.audio_url)
      console.log('時長:', status.duration, '秒')
      return status
    } else if (status.status === 'failed') {
      console.error('❌ 生成失敗:', status.error)
      throw new Error(status.error)
    }
    
    // 等待 3 秒
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  throw new Error('超時: 生成時間過長')
}

// 主函數
async function main() {
  try {
    console.log('🎵 開始生成音樂...')
    const generationId = await generateMusic()
    
    const result = await waitForCompletion(generationId)
    
    console.log('\n完整結果:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('發生錯誤:', error.message)
    process.exit(1)
  }
}

// 執行
main()