import axios from 'axios';

export type Resolution = '1024x1024' | '1792x1024' | '1024x1792';
export type Quality = 'standard' | 'hd';
export type ImageStyle = 'vivid' | 'natural';
export type Background = 'white' | 'transparent' | 'natural' | 'studio' | 'gradient';

export interface GenerateImageInput {
  prompt: string;
  resolution?: Resolution;
  quality?: Quality;
  style?: ImageStyle;
  background?: Background;
}

export interface GenerateImageResult {
  url: string;
  revised_prompt: string;
  generated_at: string;
}

export interface BatchRowResult {
  plant_name: string;
  prompt: string;
  status: 'success' | 'failed';
  url?: string;
  revised_prompt?: string;
  error?: string;
}

export interface BatchGenerateResult {
  total: number;
  succeeded: number;
  failed: number;
  estimated_minutes: number;
  results: BatchRowResult[];
}

export interface ImageServiceOptions {
  resolutions: Resolution[];
  qualities: Quality[];
  styles: ImageStyle[];
  backgrounds: Background[];
}

// Separate axios instance — does NOT share the main Bearer-token interceptors
const imageServiceAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL,
  timeout: 120_000, // 2 min — batch generation can be slow
  headers: {
    'X-API-Key': process.env.NEXT_PUBLIC_IMAGE_SERVICE_API_KEY ?? '',
  },
});

export const imageGeneratorClient = {
  generateSingle: (data: GenerateImageInput): Promise<{ success: boolean; data: GenerateImageResult }> =>
    imageServiceAxios
      .post('/api/generate', data)
      .then((r) => r.data),

  generateBatch: (formData: FormData): Promise<{ success: boolean; data: BatchGenerateResult }> =>
    imageServiceAxios
      .post('/api/generate/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600_000, // 10 min for large batches
      })
      .then((r) => r.data),

  getOptions: (): Promise<{ success: boolean; data: ImageServiceOptions }> =>
    imageServiceAxios.get('/api/options').then((r) => r.data),

  healthCheck: (): Promise<{ status: string }> =>
    imageServiceAxios.get('/api/health').then((r) => r.data),
};
