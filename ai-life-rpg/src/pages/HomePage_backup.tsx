import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setConfig, startGame, loading, error } = useAppStore();
  const [modelId, setModelId] = useState('anthropic.claude-3-sonnet-20240229-v1:0');
  const [apiBaseUrl, setApiBaseUrl] = useState(''); // 空白時使用 mock

  const handleStart = async () => {
    if (!modelId.trim()) {
      alert('請填寫 Model ID');
      return;
    }
    
    // 設定配置並開始遊戲
    setConfig(modelId.trim(), apiBaseUrl.trim());
    
    try {
      await startGame();
      // 成功後跳轉到遊戲頁面
      navigate('/game');
    } catch (err) {
      // 錯誤已由 startGame 處理
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        padding: '40px',
        display: 'flex',
        gap: '60px',
        alignItems: 'center'
      }}>
        {/* 左側標題 */}
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0,
            lineHeight: 1.2
          }}>
            AI 模擬人生 RPG
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#666',
            marginTop: '20px'
          }}>
            體驗由 AI 驅動的人生模擬遊戲
          </p>
        </div>

        {/* 右側輸入區 */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Model ID *
            </label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="請輸入 Model ID"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              API Base URL (空白使用 Mock 資料)
            </label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://xxx.execute-api... (可留空)"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
            <div style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '4px'
            }}>
              留空時將使用假資料進行測試
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#c33'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#ccc' : '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '初始化中...' : '開始遊戲'}
          </button>
        </div>
      </div>
    </div>
  );
};