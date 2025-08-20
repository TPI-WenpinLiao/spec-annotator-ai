
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Annotation, Point, MarkerStyle } from '../types';

interface AnnotationCanvasProps {
  image: HTMLImageElement;
  annotations: Annotation[];
  displayNumbers: { [id: number]: string };
  onAddAnnotation: (point: Point) => void;
  onUpdateAnnotation: (id: number, updates: Partial<Annotation>) => void;
  onRequestDelete: (id: number) => void;
  generalMarkerStyle: MarkerStyle;
  actionableMarkerStyle: MarkerStyle;
  selectedAnnotationId: number | null;
  onSelectAnnotation: (id: number | null) => void;
}

export interface AnnotationCanvasRef {
  downloadImage: () => void;
}

const AnnotationCanvas = forwardRef<AnnotationCanvasRef, AnnotationCanvasProps>(({ 
  image, 
  annotations, 
  displayNumbers,
  onAddAnnotation, 
  onUpdateAnnotation,
  onRequestDelete,
  generalMarkerStyle, 
  actionableMarkerStyle,
  selectedAnnotationId,
  onSelectAnnotation
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [draggingAnnotationId, setDraggingAnnotationId] = useState<number | null>(null);
  const dragStartPos = useRef<Point | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    annotations.forEach((anno) => {
      const { point, id, annotationType } = anno;
      const markerStyle = annotationType === 'actionable' ? actionableMarkerStyle : generalMarkerStyle;
      const idText = displayNumbers[id] || '?';
      
      const { x, y } = point;
      const radius = 14;
      
      // Draw selection glow first
      if (id === selectedAnnotationId) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 235, 59, 0.5)'; // Yellow glow
        ctx.shadowColor = 'rgba(255, 235, 59, 1)';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = markerStyle.backgroundColor;
      ctx.fill();

      ctx.strokeStyle = markerStyle.borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      const fontSize = 16;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = markerStyle.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(idText, x, y);
    });

  }, [image, annotations, displayNumbers, generalMarkerStyle, actionableMarkerStyle, selectedAnnotationId]);

  useImperativeHandle(ref, () => ({
    downloadImage: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Temporarily deselect for clean download
      const currentSelection = selectedAnnotationId;
      onSelectAnnotation(null);

      // Force a redraw without the highlight before downloading
      setTimeout(() => {
        const originalCursor = canvas.style.cursor;
        canvas.style.cursor = 'default';
        draw(); 
        const link = document.createElement('a');
        link.download = 'annotated-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        canvas.style.cursor = originalCursor;
        // Restore selection
        onSelectAnnotation(currentSelection);
      }, 50); // Small timeout to allow state to update and canvas to redraw
    }
  }));

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
          x: (e.clientX - rect.left) / scale,
          y: (e.clientY - rect.top) / scale,
      };
  };
  
  const getAnnotationAtPos = useCallback((pos: Point): Annotation | null => {
    const radius = 14;
    for (let i = annotations.length - 1; i >= 0; i--) {
        const anno = annotations[i];
        const distance = Math.sqrt(Math.pow(pos.x - anno.point.x, 2) + Math.pow(pos.y - anno.point.y, 2));
        if (distance <= radius) {
             return anno;
        }
    }
    return null;
  }, [annotations]);
  
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container && image) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imageAspectRatio = image.naturalWidth / image.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      let newWidth, newHeight;
      if (imageAspectRatio > containerAspectRatio) {
        newWidth = containerWidth;
        newHeight = containerWidth / imageAspectRatio;
      } else {
        newHeight = containerHeight;
        newWidth = containerHeight * imageAspectRatio;
      }
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const newScale = newWidth / image.naturalWidth;
      setScale(newScale);
      draw();
    }
  }, [image, draw]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [image, resizeCanvas]);

  useEffect(() => {
    draw();
  }, [annotations, selectedAnnotationId, draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only handle left-clicks for dragging/adding
    const pos = getCanvasCoordinates(e);
    dragStartPos.current = pos;
    const clickedAnnotation = getAnnotationAtPos(pos);
    if (clickedAnnotation) {
        setDraggingAnnotationId(clickedAnnotation.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getCanvasCoordinates(e);
    if (draggingAnnotationId !== null) {
        onUpdateAnnotation(draggingAnnotationId, { point: { x: Math.round(pos.x), y: Math.round(pos.y) } });
        canvas.style.cursor = 'grabbing';
    } else {
        const hoveredAnnotation = getAnnotationAtPos(pos);
        canvas.style.cursor = hoveredAnnotation ? 'grab' : 'crosshair';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getCanvasCoordinates(e);
    const wasDragging = draggingAnnotationId !== null;

    setDraggingAnnotationId(null);
    canvas.style.cursor = getAnnotationAtPos(pos) ? 'grab' : 'crosshair';

    if (dragStartPos.current) {
        const dist = Math.sqrt(
            Math.pow(pos.x - dragStartPos.current.x, 2) + 
            Math.pow(pos.y - dragStartPos.current.y, 2)
        );
        // If it was a click (not a drag)
        if (dist < 5 && !wasDragging) {
            const clickedAnnotation = getAnnotationAtPos(pos);
            if (clickedAnnotation) {
                // Toggle selection
                onSelectAnnotation(selectedAnnotationId === clickedAnnotation.id ? null : clickedAnnotation.id);
            } else {
                // Add new annotation
                onAddAnnotation({ x: Math.round(pos.x), y: Math.round(pos.y) });
            }
        }
    }
    dragStartPos.current = null;
  };

  const handleMouseLeave = () => {
    setDraggingAnnotationId(null);
    dragStartPos.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const pos = getCanvasCoordinates(e);
      const annotationToDelete = getAnnotationAtPos(pos);
      if (annotationToDelete) {
          onRequestDelete(annotationToDelete.id);
      }
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center max-h-[calc(100vh-200px)]">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        className="rounded-md"
      />
    </div>
  );
});

export default AnnotationCanvas;
