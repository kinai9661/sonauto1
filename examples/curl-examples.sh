#!/bin/bash
# Sonauto API cURL 使用示例

# 配置
WORKER_URL="https://your-worker.workers.dev"

echo "🎵 Sonauto API 示例"
echo "=================="
echo ""

# 示例 1: 生成音樂
echo "📝 示例 1: 生成音樂"
echo "-------------------"

GENERATION_RESPONSE=$(curl -s -X POST "$WORKER_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["搖滾", "激昂"],
    "prompt": "一首充滿能量的搖滾歌曲",
    "lyrics": "站起來\n不要害怕\n讓全世界聽到你的聲音",
    "duration": 90
  }')

echo "響應: $GENERATION_RESPONSE"

# 提取 generation_id
GENERATION_ID=$(echo $GENERATION_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "生成ID: $GENERATION_ID"
echo ""

# 示例 2: 查詢狀態
echo "📊 示例 2: 查詢狀態"
echo "-------------------"

if [ ! -z "$GENERATION_ID" ]; then
  STATUS_RESPONSE=$(curl -s "$WORKER_URL/status/$GENERATION_ID")
  echo "響應: $STATUS_RESPONSE"
else
  echo "錯誤: 無法獲取 generation_id"
fi
echo ""

# 示例 3: 擴展音樂
echo "🎼 示例 3: 擴展音樂"
echo "-------------------"

curl -s -X POST "$WORKER_URL/extend" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_id": "YOUR_AUDIO_ID",
    "duration": 30,
    "prompt": "繼續之前的旋律,增加鼓點和貝斯"
  }' | jq '.'
echo ""

# 示例 4: Inpaint (音頻內容替換)
echo "✏️ 示例 4: Inpaint"
echo "-------------------"

curl -s -X POST "$WORKER_URL/inpaint" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_id": "YOUR_AUDIO_ID",
    "start_time": 10.0,
    "end_time": 20.0,
    "prompt": "在這個位置加入吉他獨奏"
  }' | jq '.'
echo ""

# 示例 5: 輪詢直到完成
echo "⏳ 示例 5: 輪詢狀態直到完成"
echo "----------------------------"

if [ ! -z "$GENERATION_ID" ]; then
  MAX_ATTEMPTS=60
  ATTEMPT=0
  
  while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    STATUS_RESPONSE=$(curl -s "$WORKER_URL/status/$GENERATION_ID")
    STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    echo "[$ATTEMPT/$MAX_ATTEMPTS] 狀態: $STATUS"
    
    if [ "$STATUS" = "completed" ]; then
      echo "✅ 生成完成!"
      echo "完整響應: $STATUS_RESPONSE" | jq '.'
      break
    elif [ "$STATUS" = "failed" ]; then
      echo "❌ 生成失敗"
      echo "錯誤信息: $STATUS_RESPONSE" | jq '.'
      break
    fi
    
    sleep 3
  done
  
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "⚠️ 超時: 已達最大嘗試次數"
  fi
else
  echo "錯誤: 無法獲取 generation_id"
fi

echo ""
echo "✨ 示例完成!"