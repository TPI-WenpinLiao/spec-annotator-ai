
import React from 'react';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  const HelpSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-cyan-400 border-b border-cyan-700 pb-2 mb-3">{title}</h3>
        <div className="space-y-2 text-gray-300 text-sm leading-relaxed">
            {children}
        </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-200">操作說明</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="關閉說明"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
            <HelpSection title="1. 開始使用">
                <p>點擊或拖曳上傳一張使用者介面的截圖。</p>
                <p>AI 將會自動分析圖片，偵測並標示出所有可互動的 UI 元件。</p>
            </HelpSection>

            <HelpSection title="2. 標示互動">
                <p><b>新增標示：</b>在側邊欄選擇標示類型（一般／可操作），然後在圖片的空白處點擊即可新增。</p>
                <p><b>選取標示：</b>在圖片上點擊一個標示點，或在右側列表中點擊對應項目，即可選取並進行編輯。</p>
                <p><b>移動標示：</b>按住並拖曳圖片上的標示點，即可微調其位置。</p>
                <p><b>刪除標示：</b>在標示點上按<b>右鍵</b>，或點擊右側列表項目旁的 <b>"X"</b> 按鈕，即可刪除。</p>
            </HelpSection>

            <HelpSection title="3. 側邊欄功能">
                <p><b>新增標示類型：</b>決定手動新增的標示是「一般」還是「可操作」類型。</p>
                <p><b>篩選檢視：</b>在「全部」、「一般」、「可操作」之間切換，只顯示您想看的標示。</p>
                <p><b>編輯註釋：</b>選取一個標示後，在下方的編輯區輸入該項目的詳細說明。</p>
                <p><b>標示樣式：</b>展開樣式設定，您可以分別自訂「一般」和「可操作」標示的背景、邊框和文字顏色。</p>
            </HelpSection>

            <HelpSection title="4. 匯出成果">
                <p>完成所有標示後，點擊頂部的「下載圖片」按鈕，即可將包含所有標示的圖片儲存至您的電腦。</p>
            </HelpSection>
        </main>
      </div>
    </div>
  );
};

export default HelpGuide;
