
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Annotation, MarkerStyle, DisplayFilter, Point, AnnotationType } from './types';
import Uploader from './components/Uploader';
import AnnotationCanvas, { AnnotationCanvasRef } from './components/AnnotationCanvas';
import AnnotationSidebar from './components/AnnotationSidebar';
import ConfirmationModal from './components/ConfirmationModal';
import HelpGuide from './components/HelpGuide';
import ApiKeyModal from './components/ApiKeyModal';
import { detectAndDescribeUI } from './services/geminiService';

const AnalyzingLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl mx-auto">
        <svg className="animate-spin h-12 w-12 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-xl font-semibold text-gray-200">Analyzing Image...</h2>
        <p className="text-gray-400 mt-2 text-center">The AI is identifying UI elements. Please wait a moment.</p>
    </div>
);

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [displayFilter, setDisplayFilter] = useState<DisplayFilter>('all');
  const [manualAnnotationType, setManualAnnotationType] = useState<AnnotationType>('general');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null);
  const [annotationToDelete, setAnnotationToDelete] = useState<number | null>(null);
  const [isHelpVisible, setIsHelpVisible] = useState<boolean>(false);
  
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(() => !localStorage.getItem('gemini-api-key'));
  
  const [generalMarkerStyle, setGeneralMarkerStyle] = useState<MarkerStyle>({
    backgroundColor: '#0dcaf0', // Cyan
    borderColor: '#ffffff',   // White
    textColor: '#ffffff',     // White
  });
  const [actionableMarkerStyle, setActionableMarkerStyle] = useState<MarkerStyle>({
    backgroundColor: '#f59e0b', // Amber
    borderColor: '#ffffff',   // White
    textColor: '#ffffff',     // White
  });

  const canvasRef = useRef<AnnotationCanvasRef>(null);
  
  const handleImageUpload = (file: File) => {
    if (!apiKey) {
      alert("請先在設定中提供您的 Gemini API Key。");
      setIsApiKeyModalOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        setImage(img);
        setAnnotations([]);
        setSelectedAnnotationId(null);
        setIsAnalyzing(true);
        try {
          const detectedAnnotations = await detectAndDescribeUI(img, apiKey);
          setAnnotations(detectedAnnotations);
        } catch (error) {
          console.error("Failed to detect UI elements:", error);
          if (error instanceof Error && /API key not valid/.test(error.message)) {
            alert("API Key 無效，請檢查後再試一次。");
            setApiKey(null);
            localStorage.removeItem('gemini-api-key');
            setIsApiKeyModalOpen(true);
          } else {
            alert("AI 分析時發生錯誤，請檢查主控台以獲取詳細資訊。");
          }
        } finally {
          setIsAnalyzing(false);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const handleReset = () => {
    setImage(null);
    setAnnotations([]);
    setIsAnalyzing(false);
    setSelectedAnnotationId(null);
  };

  const handleDownload = () => {
    canvasRef.current?.downloadImage();
  };
  
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
    setIsApiKeyModalOpen(false);
  };

  const handleClearApiKey = () => {
    setApiKey(null);
    localStorage.removeItem('gemini-api-key');
    // Do not close the modal, allowing the user to enter a new key immediately.
  };


  // --- Annotation Manipulation Handlers ---
  const addAnnotation = (point: Point) => {
    const newAnnotation: Annotation = {
        id: Date.now(),
        point,
        description: '',
        elementType: 'manual',
        annotationType: manualAnnotationType
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    setSelectedAnnotationId(newAnnotation.id);
  };

  const deleteAnnotation = (id: number) => {
    setAnnotations(prev => prev.filter(anno => anno.id !== id));
    if (selectedAnnotationId === id) {
        setSelectedAnnotationId(null);
    }
  };
  
  const updateAnnotation = (id: number, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(anno => anno.id === id ? { ...anno, ...updates } : anno));
  };

  // --- Deletion Confirmation Handlers ---
  const handleRequestDelete = (id: number) => {
    setAnnotationToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (annotationToDelete !== null) {
      deleteAnnotation(annotationToDelete);
      setAnnotationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setAnnotationToDelete(null);
  };

  // --- Derived State with useMemo ---
  const sortedAnnotations = useMemo(() => {
    // Sort annotations by position: top-to-bottom, then left-to-right.
    return [...annotations].sort((a, b) => {
      if (a.point.y !== b.point.y) {
        return a.point.y - b.point.y;
      }
      return a.point.x - b.point.x;
    });
  }, [annotations]);

  const filteredAnnotations = useMemo(() => {
    // The list displayed in the sidebar and on the canvas should also be sorted.
    if (displayFilter === 'all') return sortedAnnotations;
    return sortedAnnotations.filter(a => a.annotationType === displayFilter);
  }, [sortedAnnotations, displayFilter]);

  const displayNumbers = useMemo(() => {
    const numberMap: { [id: number]: string } = {};
    let generalCount = 1;
    let actionableCount = 1;
    
    // Base numbering on the full sorted list to maintain consistency across filters.
    sortedAnnotations.forEach(anno => {
      if (anno.annotationType === 'general') {
        numberMap[anno.id] = `${generalCount++}`;
      } else {
        numberMap[anno.id] = `A${actionableCount++}`;
      }
    });
    return numberMap;
  }, [sortedAnnotations]);


  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex flex-col">
      <header className="bg-gray-800 shadow-lg p-4 z-10 flex-shrink-0">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">Spec Annotator AI</h1>
          <div className="flex items-center space-x-4">
            {image && (
              <>
                  <button
                      onClick={handleDownload}
                      className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Image
                  </button>
                  <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                  >
                      Upload New Image
                  </button>
              </>
            )}
            <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full shadow-md transition-colors duration-300"
                aria-label="設定 API Key"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            <button
                onClick={() => setIsHelpVisible(true)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full shadow-md transition-colors duration-300"
                aria-label="操作說明"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 lg:p-8 flex min-h-0">
        {!image ? (
          <Uploader onImageUpload={handleImageUpload} />
        ) : (
          isAnalyzing ? (
            <div className="flex-grow flex items-center justify-center">
               <AnalyzingLoader />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
              <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-2xl p-4 flex items-start justify-center">
                 <AnnotationCanvas 
                    ref={canvasRef} 
                    image={image} 
                    annotations={filteredAnnotations} 
                    onAddAnnotation={addAnnotation}
                    onUpdateAnnotation={updateAnnotation}
                    onRequestDelete={handleRequestDelete}
                    displayNumbers={displayNumbers}
                    generalMarkerStyle={generalMarkerStyle}
                    actionableMarkerStyle={actionableMarkerStyle}
                    selectedAnnotationId={selectedAnnotationId}
                    onSelectAnnotation={setSelectedAnnotationId}
                 />
              </div>
              <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-2xl p-4 flex flex-col min-h-0">
                <AnnotationSidebar 
                  annotations={filteredAnnotations}
                  displayNumbers={displayNumbers}
                  onRequestDelete={handleRequestDelete}
                  onUpdateAnnotation={updateAnnotation}
                  displayFilter={displayFilter}
                  setDisplayFilter={setDisplayFilter}
                  manualAnnotationType={manualAnnotationType}
                  setManualAnnotationType={setManualAnnotationType}
                  generalMarkerStyle={generalMarkerStyle}
                  setGeneralMarkerStyle={setGeneralMarkerStyle}
                  actionableMarkerStyle={actionableMarkerStyle}
                  setActionableMarkerStyle={setActionableMarkerStyle}
                  selectedAnnotationId={selectedAnnotationId}
                  onSelectAnnotation={setSelectedAnnotationId}
                />
              </div>
            </div>
          )
        )}
      </main>
      <ConfirmationModal
        isOpen={annotationToDelete !== null}
        title="確認刪除"
        message={`您確定要刪除標示 ${annotationToDelete !== null ? displayNumbers[annotationToDelete] : ''} 嗎？`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <HelpGuide
        isOpen={isHelpVisible}
        onClose={() => setIsHelpVisible(false)}
      />
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        isCancellable={!!apiKey}
        onSave={handleSaveApiKey}
        onClose={() => setIsApiKeyModalOpen(false)}
        onClear={handleClearApiKey}
      />
    </div>
  );
};

export default App;
