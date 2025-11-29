# Sonauto API 反向代理

基於 Cloudflare Workers 的 Sonauto.ai 音樂生成 API 反向代理服務。

## 功能特性

- ✅ **完整 API 支持**: 音樂生成、擴展、Inpaint、狀態查詢
- 🌍 **全球加速**: 利用 Cloudflare 全球網路實現低延遲訪問
- 🔒 **安全可靠**: 支持 API Key 環境變量配置
- 🆓 **完全免費**: 運行在 Cloudflare Workers 免費層級
- 📊 **請求日誌**: 記錄請求時間和響應狀態
- ⚡ **智能路由**: 自動轉換簡化端點到實際 API 路徑
- 🛡️ **錯誤處理**: 詳細的錯誤信息和超時保護

## 快速開始

### 1. 部署到 Cloudflare Workers

#### 方法一: 使用 Wrangler CLI (推薦)

```bash
# 安裝 Wrangler
npm install -g wrangler

# 登入 Cloudflare
wrangler login

# 克隆項目
git clone https://github.com/kinai9661/sonauto1.git
cd sonauto1

# 配置環境變量
wrangler secret put SONAUTO_API_KEY
# 輸入你的 Sonauto API Key

# 部署
wrangler deploy
```

#### 方法二: 手動部署

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 進入 **Workers & Pages** → **Create application** → **Create Worker**
3. 複製 `src/index.js` 或 `src/advanced.js` 的代碼
4. 貼上並點擊 **Save and Deploy**
5. 在 Worker 設置中添加環境變量 `SONAUTO_API_KEY`

### 2. 獲取 Sonauto API Key

1. 訪問 [Sonauto 開發者頁面](https://sonauto.ai/developers)
2. 註冊帳號並登入
3. 獲取 1,500 免費積分
4. 複製你的 API Key

## API 端點

### 生成音樂

```http
POST /generate
Content-Type: application/json

{
  "tags": ["搖滾", "激昂"],
  "prompt": "一首充滿能量的搖滾歌曲",
  "lyrics": "你的歌詞內容...",
  "duration": 120
}
```

### 查詢狀態

```http
GET /status/{generation_id}
```

### 擴展音樂

```http
POST /extend
Content-Type: application/json

{
  "audio_id": "原始音頻ID",
  "duration": 30,
  "prompt": "擴展描述"
}
```

### Inpaint (音頻內容替換)

```http
POST /inpaint
Content-Type: application/json

{
  "audio_id": "原始音頻ID",
  "start_time": 10.0,
  "end_time": 20.0,
  "prompt": "替換內容描述"
}
```

## 使用示例

### JavaScript/Node.js

```javascript
// 生成音樂
const response = await fetch('https://your-worker.workers.dev/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tags: ['流行', '抒情'],
    prompt: '一首溫柔的情歌',
    lyrics: '在這個寂靜的夜晚\\n我想起了你的笑容...'
  })
})

const data = await response.json()
console.log('生成ID:', data.id)

// 輪詢狀態直到完成
let status
while (true) {
  const statusResponse = await fetch(
    `https://your-worker.workers.dev/status/${data.id}`
  )
  status = await statusResponse.json()
  
  if (status.status === 'completed') {
    console.log('音頻URL:', status.audio_url)
    break
  } else if (status.status === 'failed') {
    console.error('生成失敗:', status.error)
    break
  }
  
  // 等待 3 秒後再次查詢
  await new Promise(resolve => setTimeout(resolve, 3000))
}
```

### Python

```python
import requests
import time

# 生成音樂
response = requests.post(
    'https://your-worker.workers.dev/generate',
    json={
        'tags': ['電子', '舞曲'],
        'prompt': '一首充滿節奏感的電子舞曲',
        'duration': 90
    }
)

data = response.json()
generation_id = data['id']
print(f'生成ID: {generation_id}')

# 輪詢狀態
while True:
    status_response = requests.get(
        f'https://your-worker.workers.dev/status/{generation_id}'
    )
    status = status_response.json()
    
    if status['status'] == 'completed':
        print(f"音頻URL: {status['audio_url']}")
        break
    elif status['status'] == 'failed':
        print(f"生成失敗: {status.get('error')}")
        break
    
    time.sleep(3)
```

### cURL

```bash
# 生成音樂
curl -X POST https://your-worker.workers.dev/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "tags": ["爵士", "輕鬆"],
    "prompt": "一首輕鬆的爵士樂",
    "duration": 60
  }'

# 查詢狀態
curl https://your-worker.workers.dev/status/YOUR_GENERATION_ID
```

## 項目結構

```
sonauto1/
├── src/
│   ├── index.js          # 基礎版 Worker 代碼
│   └── advanced.js       # 進階版 Worker 代碼(帶日誌和路由)
├── wrangler.toml         # Wrangler 配置文件
├── package.json          # 項目依賴
├── README.md             # 項目文檔
└── examples/             # 使用示例
    ├── node-example.js
    ├── python-example.py
    └── curl-examples.sh
```

## 配置說明

### wrangler.toml

```toml
name = "sonauto-api-proxy"
main = "src/advanced.js"
compatibility_date = "2025-11-29"

[env.production]
vars = { ENVIRONMENT = "production" }

# 可選: 綁定自定義域名
[[env.production.routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### 環境變量

| 變量名 | 說明 | 必需 |
|--------|------|------|
| `SONAUTO_API_KEY` | Sonauto API 密鑰 | 是 |
| `ENVIRONMENT` | 環境標識 (production/development) | 否 |

## 進階功能

### 自定義域名

在 `wrangler.toml` 中配置自定義路由:

```toml
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### 請求日誌

進階版本 (`src/advanced.js`) 包含詳細的請求日誌:

- 請求方法和 URL
- 響應狀態碼
- 請求耗時
- 錯誤信息

在 Cloudflare Dashboard 的 **Workers** → **你的 Worker** → **Logs** 中查看。

### 超時控制

默認請求超時時間為 30 秒,可在 `CONFIG` 對象中修改:

```javascript
const CONFIG = {
  TARGET_API: 'https://api.sonauto.ai',
  VERSION: 'v1',
  TIMEOUT: 30000, // 修改這裡 (毫秒)
}
```

## 常見問題

### Q: 如何獲取免費的 Sonauto API Key?

A: 訪問 [sonauto.ai/developers](https://sonauto.ai/developers),註冊帳號即可獲得 1,500 免費積分。

### Q: Worker 有請求限制嗎?

A: Cloudflare Workers 免費版有以下限制:
- 每天 100,000 次請求
- 每個請求最多 10ms CPU 時間
- 每個請求最多 128MB 內存

### Q: 如何監控 API 使用情況?

A: 在 Cloudflare Dashboard 的 Analytics 面板查看請求數量、錯誤率等指標。

### Q: 支持 Webhook 回調嗎?

A: 支持!在生成音樂時添加 `webhook_url` 參數:

```javascript
{
  "tags": ["流行"],
  "prompt": "...",
  "webhook_url": "https://your-server.com/webhook"
}
```

### Q: 如何處理大量並發請求?

A: Cloudflare Workers 自動處理擴展,無需額外配置。建議在客戶端實現請求隊列和重試機制。

## 技術支持

- **Sonauto 官方文檔**: https://sonauto.ai/developers
- **Cloudflare Workers 文檔**: https://developers.cloudflare.com/workers/
- **問題反饋**: [GitHub Issues](https://github.com/kinai9661/sonauto1/issues)

## 授權

MIT License

## 相關項目

- [Sonauto 官方 API 示例](https://github.com/Sonauto/sonauto-api-examples)
- [Cloudflare Workers 模板](https://github.com/cloudflare/workers-sdk)

## 更新日誌

### v1.0.0 (2025-11-29)

- 🎉 初始版本發布
- ✅ 支持完整的 Sonauto API 功能
- ✅ 實現智能路由和 CORS 處理
- ✅ 添加請求日誌和錯誤處理
- ✅ 提供基礎版和進階版代碼

---

由 [kinai9661](https://github.com/kinai9661) 維護 | 基於 Cloudflare Workers 構建