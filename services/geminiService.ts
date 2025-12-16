
import { GoogleGenAI, Type } from "@google/genai";
import { Annotation, AnnotationType } from '../types';

// Utility to convert image element to base64
const imageToBase64 = (image: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(image, 0, 0);
  // Use PNG for lossless quality, which is better for UI screenshots with sharp edges.
  return canvas.toDataURL('image/png').split(',')[1];
};

interface Point {
  x: number;
  y: number;
}

interface DetectedObject {
  topLeft: Point;
  bottomRight: Point;
  description: string;
  elementType: string;
}

// Only items that trigger an action or navigation are 'actionable'.
// Form fields are considered 'general' as they are for data input.
const ACTIONABLE_TYPES: string[] = ['button', 'link', 'tab'];

export const detectAndDescribeUI = async (image: HTMLImageElement, apiKey: string): Promise<Annotation[]> => {
  if (!apiKey) {
    throw new Error("API Key is required for analysis.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const imageBase64 = imageToBase64(image);

  const prompt = `
    Analyze this user interface screenshot of size ${image.naturalWidth}x${image.naturalHeight} pixels.
    Your task is to identify all key interactive UI elements.
    The coordinate system origin (0,0) is the absolute top-left corner of the image. All coordinates you provide must be relative to this origin.

    IMPORTANT PLACEMENT RULE: 
    We will place annotation markers on the "Top-Right" edge of the elements you identify to avoid covering text labels. 
    Therefore, ensure your 'topLeft' and 'bottomRight' coordinates form a tight bounding box around the visual element (e.g., the button border or the icon area).

    For each identified element, provide:
    1. 'description': A concise description for a software specification document, written in Traditional Chinese (正體中文).
    2. 'elementType': The type of the element ('button', 'input', 'link', 'icon', 'dropdown', 'checkbox', 'image', 'text', 'tab', 'other').
    3. 'topLeft': An object with 'x' and 'y' integer coordinates for the top-left corner of the element's bounding box.
    4. 'bottomRight': An object with 'x' and 'y' integer coordinates for the bottom-right corner of the element's bounding box.

    Here is an example of a perfect response for a single element:
    {
      "topLeft": { "x": 100, "y": 200 },
      "bottomRight": { "x": 180, "y": 232 },
      "description": "用於使用者登入的主要操作按鈕。",
      "elementType": "button"
    }
    
    Ensure your response is a JSON array of objects that strictly follows the provided schema.
    Do not include any other text or explanations outside of the JSON structure.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: imageBase64 } },
        { text: prompt },
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topLeft: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.INTEGER, description: "The x-coordinate of the top-left corner, relative to the image's top-left origin." },
                y: { type: Type.INTEGER, description: "The y-coordinate of the top-left corner, relative to the image's top-left origin." },
              },
              required: ["x", "y"],
            },
            bottomRight: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER, description: "The x-coordinate of the bottom-right corner, relative to the image's top-left origin." },
                  y: { type: Type.INTEGER, description: "The y-coordinate of the bottom-right corner, relative to the image's top-left origin." },
                },
                required: ["x", "y"],
              },
            description: { 
              type: Type.STRING,
              description: "A concise description of the UI element and its function."
            },
            elementType: {
              type: Type.STRING,
              description: "The type of UI element. Must be one of: 'button', 'input', 'link', 'icon', 'dropdown', 'checkbox', 'image', 'text', 'tab', 'other'."
            }
          },
          required: ["topLeft", "bottomRight", "description", "elementType"],
        },
      },
    },
  });
  
  const resultText = response.text.trim();
  const detectedObjects: DetectedObject[] = JSON.parse(resultText);

  // Calculate center point, classify, and create unique IDs.
  const annotations: Annotation[] = detectedObjects
    .map((obj, index) => {
        const { topLeft, bottomRight } = obj;
        
        // Stricter filtering for invalid or off-screen boxes
        if (
            !topLeft || !bottomRight || // Ensure points exist
            topLeft.x >= bottomRight.x || // Invalid width
            topLeft.y >= bottomRight.y || // Invalid height
            bottomRight.x <= 0 || // Box is completely to the left
            topLeft.x >= image.naturalWidth || // Box is completely to the right
            bottomRight.y <= 0 || // Box is completely above
            topLeft.y >= image.naturalHeight // Box is completely below
        ) {
            return null; // Discard this invalid annotation
        }

        // Clamp the box coordinates to be within the image bounds
        const x1 = Math.max(0, topLeft.x);
        const y1 = Math.max(0, topLeft.y);
        const x2 = Math.min(image.naturalWidth, bottomRight.x);
        const y2 = Math.min(image.naturalHeight, bottomRight.y);

        // Calculate the marker position.
        // PREVIOUSLY: Center (often covered text).
        // let centerX = Math.round((x1 + x2) / 2);
        // let centerY = Math.round((y1 + y2) / 2);

        // NEW: Top-Right Corner.
        // We place the marker on the top edge, aligned to the right side (x2).
        // This acts like a notification badge and generally avoids left-aligned or centered text.
        let centerX = x2;
        let centerY = y1;
        
        // Final safeguard clamp
        centerX = Math.max(0, Math.min(centerX, image.naturalWidth));
        centerY = Math.max(0, Math.min(centerY, image.naturalHeight));

        const elementType = obj.elementType || 'other';
        const annotationType: AnnotationType = ACTIONABLE_TYPES.includes(elementType.toLowerCase()) ? 'actionable' : 'general';
        
        return {
            id: Date.now() + index, // Use a timestamp-based unique ID
            point: { x: centerX, y: centerY },
            description: obj.description,
            elementType,
            annotationType,
        };
    })
    .filter((anno): anno is Annotation => anno !== null);

  return annotations;
};
