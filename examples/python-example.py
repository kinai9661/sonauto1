#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sonauto API Python 使用示例"""

import requests
import time
import json
from typing import Dict, Optional

# 配置
WORKER_URL = 'https://your-worker.workers.dev'


def generate_music(
    tags: list,
    prompt: str,
    lyrics: Optional[str] = None,
    duration: int = 90
) -> str:
    """生成音樂
    
    Args:
        tags: 音樂風格標籤列表
        prompt: 音樂描述
        lyrics: 歌詞(可選)
        duration: 時長(秒)
    
    Returns:
        generation_id: 生成任務 ID
    """
    payload = {
        'tags': tags,
        'prompt': prompt,
        'duration': duration
    }
    
    if lyrics:
        payload['lyrics'] = lyrics
    
    response = requests.post(
        f'{WORKER_URL}/generate',
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    response.raise_for_status()
    
    data = response.json()
    generation_id = data['id']
    
    print(f'✅ 生成任務已創建')
    print(f'生成ID: {generation_id}')
    
    return generation_id


def check_status(generation_id: str) -> Dict:
    """查詢生成狀態
    
    Args:
        generation_id: 生成任務 ID
    
    Returns:
        狀態信息字典
    """
    response = requests.get(f'{WORKER_URL}/status/{generation_id}')
    response.raise_for_status()
    return response.json()


def wait_for_completion(
    generation_id: str,
    max_attempts: int = 60,
    interval: int = 3
) -> Dict:
    """等待生成完成
    
    Args:
        generation_id: 生成任務 ID
        max_attempts: 最大嘗試次數
        interval: 查詢間隔(秒)
    
    Returns:
        完成後的狀態信息
    """
    print('⏳ 等待生成完成...')
    
    for i in range(max_attempts):
        status = check_status(generation_id)
        
        print(f'[{i + 1}/{max_attempts}] 狀態: {status["status"]}')
        
        if status['status'] == 'completed':
            print('✅ 生成完成!')
            print(f'音頻URL: {status["audio_url"]}')
            print(f'時長: {status.get("duration", "N/A")} 秒')
            return status
        elif status['status'] == 'failed':
            error_msg = status.get('error', '未知錯誤')
            print(f'❌ 生成失敗: {error_msg}')
            raise Exception(error_msg)
        
        time.sleep(interval)
    
    raise TimeoutError('生成超時')


def main():
    """主函數"""
    try:
        print('🎵 Sonauto 音樂生成示例\n')
        
        # 生成音樂
        generation_id = generate_music(
            tags=['電子', '舞曲', '激昂'],
            prompt='一首充滿節奏感的電子舞曲',
            lyrics='跟著節奏搖擺\\n讓音樂點燃這一刻\\n釋放你的熱情',
            duration=120
        )
        
        # 等待完成
        result = wait_for_completion(generation_id)
        
        # 輸出完整結果
        print('\n📋 完整結果:')
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
    except requests.exceptions.RequestException as e:
        print(f'❌ 請求錯誤: {e}')
    except Exception as e:
        print(f'❌ 發生錯誤: {e}')


if __name__ == '__main__':
    main()