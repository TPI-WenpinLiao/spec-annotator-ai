
import React, { useState, useEffect } from 'react';
import { Annotation, MarkerStyle, DisplayFilter, AnnotationType } from '../types';

interface AnnotationSidebarProps {
  annotations: Annotation[];
  displayNumbers: { [id: number]: string };
  onRequestDelete: (id: number) => void;
  onUpdateAnnotation: (id: number, updates: Partial<Annotation>) => void;
  displayFilter: DisplayFilter;
  setDisplayFilter: React.Dispatch<React.SetStateAction<DisplayFilter>>;
  manualAnnotationType: AnnotationType;
  setManualAnnotationType: React.Dispatch<React.SetStateAction<AnnotationType>>;
  generalMarkerStyle: MarkerStyle;
  setGeneralMarkerStyle: React.Dispatch<React.SetStateAction<MarkerStyle>>;
  actionableMarkerStyle: MarkerStyle;
  setActionableMarkerStyle: React.Dispatch<React.SetStateAction<MarkerStyle>>;
  selectedAnnotationId: number | null;
  onSelectAnnotation: (id: number | null) => void;
}

const StyleEditor: React.FC<{
  style: MarkerStyle;
  setStyle: React.Dispatch<React.SetStateAction<MarkerStyle>>;
}> = ({ style, setStyle }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="text-sm text-gray-300">Background</label>
      <input type="color" value={style.backgroundColor} onChange={(e) => setStyle(s => ({...s, backgroundColor: e.target.value}))} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
    </div>
    <div className="flex justify-between items-center">
      <label className="text-sm text-gray-300">Border</label>
      <input type="color" value={style.borderColor} onChange={(e) => setStyle(s => ({...s, borderColor: e.target.value}))} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
    </div>
    <div className="flex justify-between items-center">
      <label className="text-sm text-gray-300">Text Color</label>
      <input type="color" value={style.textColor} onChange={(e) => setStyle(s => ({...s, textColor: e.target.value}))} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
    </div>
  </div>
);

const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({ 
  annotations, 
  displayNumbers,
  onRequestDelete,
  onUpdateAnnotation,
  displayFilter,
  setDisplayFilter,
  manualAnnotationType,
  setManualAnnotationType,
  generalMarkerStyle,
  setGeneralMarkerStyle,
  actionableMarkerStyle,
  setActionableMarkerStyle,
  selectedAnnotationId,
  onSelectAnnotation
}) => {
  const [styleTab, setStyleTab] = useState<'general' | 'actionable'>('general');

  const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId);

  const TypeButton: React.FC<{ value: AnnotationType, label: string }> = ({ value, label }) => {
    const isActive = manualAnnotationType === value;
    const activeClasses = 'bg-cyan-600 text-white';
    const inactiveClasses = 'bg-gray-700 hover:bg-gray-600 text-gray-300';
    return (
      <button
        onClick={() => setManualAnnotationType(value)}
        className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
      >
        {label}
      </button>
    );
  };
  
  const FilterButton: React.FC<{ value: DisplayFilter, label: string }> = ({ value, label }) => {
    const isActive = displayFilter === value;
    const activeClasses = 'bg-cyan-600 text-white';
    const inactiveClasses = 'bg-gray-700 hover:bg-gray-600 text-gray-300';
    return (
      <button
        onClick={() => setDisplayFilter(value)}
        className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
      >
        {label}
      </button>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-cyan-400 border-b-2 border-gray-700 pb-2">Annotations</h2>
        
        <div className="my-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Add New Annotation As</label>
            <div className="p-1 bg-gray-900 rounded-lg flex space-x-1">
              <TypeButton value="general" label="General" />
              <TypeButton value="actionable" label="Actionable" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Filter View</label>
            <div className="p-1 bg-gray-900 rounded-lg flex space-x-1">
              <FilterButton value="all" label="All" />
              <FilterButton value="general" label="General" />
              <FilterButton value="actionable" label="Actionable" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 pr-2">
        {annotations.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
                <p>No annotations to display.</p>
                <p className="text-sm mt-1">Click on the image to add one.</p>
            </div>
        ) : (
            annotations.map((anno) => {
              const displayNumber = displayNumbers[anno.id];
              const isSelected = anno.id === selectedAnnotationId;
              const markerStyle = anno.annotationType === 'actionable' ? 'bg-amber-500' : 'bg-cyan-500';

              return (
                <div
                    key={anno.id}
                    onClick={() => onSelectAnnotation(isSelected ? null : anno.id)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center space-x-3 transition-all ${isSelected ? 'bg-cyan-800 ring-2 ring-cyan-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <div className={`flex-shrink-0 ${markerStyle} text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-base`}>
                        {displayNumber}
                    </div>
                    <p className="flex-grow text-gray-300 truncate text-sm">
                        {anno.description || <span className="italic text-gray-500">No description yet</span>}
                    </p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent selecting the item
                            onRequestDelete(anno.id);
                        }}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                        aria-label={`Delete annotation ${displayNumber}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
              );
            })
        )}
      </div>

      <div className="flex-shrink-0 mt-4 space-y-4">
        {selectedAnnotation && (
          <div className="pt-4 border-t-2 border-gray-700">
            <h3 className="text-md font-semibold text-gray-300 mb-2">Edit Annotation {displayNumbers[selectedAnnotation.id]}</h3>
            <textarea
              value={selectedAnnotation.description}
              onChange={(e) => onUpdateAnnotation(selectedAnnotation.id, { description: e.target.value })}
              placeholder={`Description for item ${displayNumbers[selectedAnnotation.id]}...`}
              rows={4}
              className="w-full bg-gray-600 text-gray-200 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            />
          </div>
        )}

        <div className="pt-4 border-t-2 border-gray-700">
          <details>
            <summary className="text-md font-semibold text-gray-400 cursor-pointer hover:text-cyan-400 list-none">
               <span className="select-none">Marker Style</span>
            </summary>
            <div className="p-3 bg-gray-900/50 rounded-lg mt-2">
              <div className="flex border-b border-gray-700 mb-2">
                <button onClick={() => setStyleTab('general')} className={`px-4 py-2 text-sm font-medium transition-colors ${styleTab === 'general' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>General</button>
                <button onClick={() => setStyleTab('actionable')} className={`px-4 py-2 text-sm font-medium transition-colors ${styleTab === 'actionable' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-gray-400 hover:text-white'}`}>Actionable</button>
              </div>
              {styleTab === 'general' ? <StyleEditor style={generalMarkerStyle} setStyle={setGeneralMarkerStyle} /> : <StyleEditor style={actionableMarkerStyle} setStyle={setActionableMarkerStyle} />}
            </div>
          </details>
        </div>

        <div className="pt-4 border-t-2 border-gray-700 text-center">
          <p className="text-sm text-gray-500">
            <b className="text-gray-400">Click</b> a marker to select. <b className="text-gray-400">Right-click</b> to delete.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            <b className="text-gray-400">Drag</b> to fine-tune position. <b className="text-gray-400">Click empty space</b> to add.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnotationSidebar;
