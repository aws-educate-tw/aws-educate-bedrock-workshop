import html2canvas from 'html2canvas';

export const exportToJPG = async (elementId: string, filename: string = 'life-report') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('找不到要匯出的元素');
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    // 轉換為 JPG
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    
    // 創建下載連結
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataURL;
    
    // 觸發下載
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    throw new Error(`匯出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};