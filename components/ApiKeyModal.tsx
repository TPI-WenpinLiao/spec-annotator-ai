
import React, { useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  isCancellable: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
  onClear: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, isCancellable, onSave, onClose, onClear }) => {
  const [currentKey, setCurrentKey] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (currentKey.trim()) {
      onSave(currentKey.trim());
      setCurrentKey(''); // Clear input after saving
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={isCancellable ? onClose : undefined}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-cyan-400 mb-4">設定您的 Gemini API Key</h2>
        <p className="text-gray-400 mb-4 text-sm">
          為了使用 AI 分析功能，您需要提供自己的 Google Gemini API Key。應用程式會將其安全地儲存在您的瀏覽器中，不會上傳至任何伺服器。
        </p>
        <p className="text-gray-400 mb-6 text-sm">
          您可以從 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a> 取得您的免費 API Key。
        </p>
        <input
          type="password"
          value={currentKey}
          onChange={(e) => setCurrentKey(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isCancellable ? "輸入新金鑰以重設" : "請在此貼上您的 API Key"}
          className="w-full bg-gray-700 text-gray-200 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition mb-6"
        />
        <div className="flex justify-between items-center">
            <div>
              {isCancellable && (
                <button
                  onClick={onClear}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                >
                  清除金鑰
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isCancellable && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                >
                  取消
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!currentKey.trim()}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isCancellable ? '重設金鑰' : '儲存金鑰'}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
