
export interface Point {
  x: number;
  y: number;
}

export type AnnotationType = 'general' | 'actionable';
export type DisplayFilter = 'all' | 'general' | 'actionable';

export interface Annotation {
  id: number; // Unique identifier (e.g., timestamp)
  point: Point;
  description: string;
  elementType: string;
  annotationType: AnnotationType;
}

export interface MarkerStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}
