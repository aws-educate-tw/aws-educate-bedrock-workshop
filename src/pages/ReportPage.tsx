import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { exportToJPG } from '../services/export';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { summaryState, reset } = useAppStore();
  const [exporting, setExporting] = useState(false);

  if (!summaryState) {
    navigate('/');
    return null;
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToJPG('export-area', 'my-life-report');
      alert('匯出成功！');
    } catch (error) {
      alert(`匯出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleRestart = () => {
    if (confirm('確定要重新開始嗎？')) {
      reset();
      navigate('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#25344F',
      padding: '20px',
      overflowY: 'auto',
      color: '#e2e0d3'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* 按鈕區 */}
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => navigate('/summary')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#5f4e42',
              color: '#e2e0d3',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            返回
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: '10px 20px',
              backgroundColor: exporting ? '#ccc' : '#ceb485',
              color: '#25344F',
              border: 'none',
              borderRadius: '4px',
              cursor: exporting ? 'not-allowed' : 'pointer'
            }}
          >
            {exporting ? '匯出中...' : '匯出 JPG'}
          </button>
          <button
            onClick={handleRestart}
            style={{
              padding: '10px 20px',
              backgroundColor: '#632024',
              color: '#e2e0d3',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重新開始
          </button>
        </div>

        {/* 三欄內容 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px'
        }}>
          {/* 左欄：成就 */}
          <div style={{
            backgroundColor: '#5f4e42',
            border: '1px solid #ceb485',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              color: '#ceb485',
              textAlign: 'center'
            }}>
              成就
            </h2>
            
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {summaryState.achievements.length > 0 ? (
                summaryState.achievements.map((achievement, index) => (
                  <div key={index} style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#25344F',
                    borderRadius: '4px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    {achievement.iconUrl && (
                      <img
                        src={achievement.iconUrl}
                        alt={achievement.title}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#ceb485',
                        marginBottom: '4px'
                      }}>
                        {achievement.title}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#e2e0d3',
                        lineHeight: 1.4
                      }}>
                        {achievement.desc}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#5f4e42', padding: '20px' }}>
                  暫無成就
                </div>
              )}
            </div>
          </div>

          {/* 中欄：關鍵抉擇 */}
          <div style={{
            backgroundColor: '#5f4e42',
            border: '1px solid #ceb485',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              color: '#ceb485',
              textAlign: 'center'
            }}>
              關鍵抉擇
            </h2>
            
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {summaryState.keyChoices.map((choice, index) => (
                <div key={index} style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: '#25344F',
                  borderRadius: '4px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#e2e0d3'
                }}>
                  <span style={{
                    fontWeight: 'bold',
                    color: '#ceb485',
                    marginRight: '8px'
                  }}>
                    {index + 1}.
                  </span>
                  {choice}
                </div>
              ))}
            </div>
          </div>

          {/* 右欄：可匯出的大圖區 */}
          <div
            id="export-area"
            style={{
            backgroundColor: '#5f4e42',
            border: '1px solid #ceb485',
            borderRadius: '8px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '24px',
              color: '#ceb485',
              textAlign: 'center'
            }}>
              我的人生旅程
            </h2>

            <div style={{
              fontSize: '14px',
              color: '#e2e0d3',
              textAlign: 'center',
              marginBottom: '20px',
              lineHeight: 1.6
            }}>
              人生分數: {summaryState.lifeScore} / 100
            </div>

            {summaryState.finalImageUrl && (
              <img
                src={summaryState.finalImageUrl}
                alt="人生終章"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: 'auto',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}
              />
            )}

            <div style={{
              fontSize: '12px',
              color: '#5f4e42',
              textAlign: 'center',
              marginTop: 'auto',
              paddingTop: '20px'
            }}>
              AI 模擬人生 RPG
              <br />
              感謝您的參與
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};