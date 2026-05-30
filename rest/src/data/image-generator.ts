import { useMutation, useQuery } from 'react-query';
import { useTranslation } from 'next-i18next';
import { toast } from 'react-toastify';
import { imageGeneratorClient, GenerateImageInput, GenerateImageResult, BatchGenerateResult } from './client/image-generator';

export const IMAGE_GENERATOR_QUERY_KEY = 'image-generator';

export function useGenerateImageMutation() {
  const { t } = useTranslation('common');
  return useMutation<{ success: boolean; data: GenerateImageResult }, Error, GenerateImageInput>(
    imageGeneratorClient.generateSingle,
    {
      onError: (error: any) => {
        toast.error(error?.response?.data?.message ?? t('error-something-wrong'));
      },
    }
  );
}

export function useGenerateBatchMutation() {
  const { t } = useTranslation('common');
  return useMutation<{ success: boolean; data: BatchGenerateResult }, Error, FormData>(
    imageGeneratorClient.generateBatch,
    {
      onError: (error: any) => {
        toast.error(error?.response?.data?.message ?? t('error-something-wrong'));
      },
    }
  );
}

export function useImageServiceOptionsQuery() {
  return useQuery(
    [IMAGE_GENERATOR_QUERY_KEY, 'options'],
    imageGeneratorClient.getOptions,
    {
      staleTime: Infinity,
      retry: 1,
    }
  );
}

export function useImageServiceHealthQuery() {
  return useQuery(
    [IMAGE_GENERATOR_QUERY_KEY, 'health'],
    imageGeneratorClient.healthCheck,
    {
      staleTime: 30_000,
      retry: false,
    }
  );
}
