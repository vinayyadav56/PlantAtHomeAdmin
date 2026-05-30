import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import TextArea from '@/components/ui/text-area';
import Select from '@/components/ui/select/select';
import Label from '@/components/ui/label';
import { useGenerateImageMutation, useImageServiceOptionsQuery, useImageServiceHealthQuery } from '@/data/image-generator';
import { GenerateImageInput, GenerateImageResult, Background, Resolution, Quality, ImageStyle } from '@/data/client/image-generator';
import ImageGeneratorResults from './image-generator-results';

type OptionItem = { label: string; value: string };

const BACKGROUND_LABELS: Record<Background, string> = {
  white: 'White (Product)',
  transparent: 'Transparent (Remove BG)',
  natural: 'Natural Outdoor',
  studio: 'Studio Grey',
  gradient: 'Soft Gradient',
};

const RESOLUTION_LABELS: Record<Resolution, string> = {
  '1024x1024': 'Square 1024×1024',
  '1792x1024': 'Landscape 1792×1024',
  '1024x1792': 'Portrait 1024×1792',
};

export default function ImageGeneratorForm() {
  const { t } = useTranslation('common');
  const [results, setResults] = useState<GenerateImageResult[]>([]);

  useImageServiceHealthQuery(); // wakes Railway service on page load

  const { data: optionsData } = useImageServiceOptionsQuery();
  const options = optionsData?.data;

  const { mutate: generate, isLoading } = useGenerateImageMutation();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<GenerateImageInput>({
    defaultValues: {
      resolution: '1024x1024',
      quality: 'hd',
      style: 'natural',
      background: 'white',
    },
  });

  const resolutionOptions: OptionItem[] = (options?.resolutions ?? ['1024x1024', '1792x1024', '1024x1792']).map((r) => ({
    value: r,
    label: RESOLUTION_LABELS[r as Resolution] ?? r,
  }));

  const qualityOptions: OptionItem[] = (options?.qualities ?? ['standard', 'hd']).map((q) => ({
    value: q,
    label: q === 'hd' ? 'HD (High Quality)' : 'Standard',
  }));

  const styleOptions: OptionItem[] = (options?.styles ?? ['vivid', 'natural']).map((s) => ({
    value: s,
    label: s === 'vivid' ? 'Vivid (Bold colors)' : 'Natural (Realistic)',
  }));

  const backgroundOptions: OptionItem[] = (options?.backgrounds ?? Object.keys(BACKGROUND_LABELS) as Background[]).map((b) => ({
    value: b,
    label: BACKGROUND_LABELS[b as Background] ?? b,
  }));

  function onSubmit(data: GenerateImageInput) {
    generate(data, {
      onSuccess: (res) => {
        setResults((prev) => [res.data, ...prev]);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-heading">{t('text-single-image-generation')}</h2>
        <p className="mt-1 text-sm text-body">{t('text-image-generator-description')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label>{t('form:input-label-image-prompt')}</Label>
          <TextArea
            {...register('prompt', { required: t('form:error-prompt-required') })}
            placeholder={t('form:placeholder-image-prompt')}
            disabled={isLoading}
            error={errors.prompt?.message}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>{t('form:input-label-resolution')}</Label>
            <Select
              options={resolutionOptions}
              defaultValue={resolutionOptions.find((o) => o.value === '1024x1024')}
              onChange={(option: any) => setValue('resolution', option?.value)}
              isDisabled={isLoading}
            />
          </div>
          <div>
            <Label>{t('form:input-label-quality')}</Label>
            <Select
              options={qualityOptions}
              defaultValue={qualityOptions.find((o) => o.value === 'hd')}
              onChange={(option: any) => setValue('quality', option?.value)}
              isDisabled={isLoading}
            />
          </div>
          <div>
            <Label>{t('form:input-label-style')}</Label>
            <Select
              options={styleOptions}
              defaultValue={styleOptions.find((o) => o.value === 'natural')}
              onChange={(option: any) => setValue('style', option?.value)}
              isDisabled={isLoading}
            />
          </div>
          <div>
            <Label>{t('form:input-label-background')}</Label>
            <Select
              options={backgroundOptions}
              defaultValue={backgroundOptions.find((o) => o.value === 'white')}
              onChange={(option: any) => setValue('background', option?.value)}
              isDisabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button loading={isLoading} disabled={isLoading}>
            {t('form:button-label-generate-image')}
          </Button>
          {results.length > 0 && (
            <button
              type="button"
              className="text-sm text-red-500 hover:underline"
              onClick={() => setResults([])}
            >
              {t('text-clear-results')}
            </button>
          )}
        </div>
      </form>

      {results.length > 0 && <ImageGeneratorResults results={results} />}
    </div>
  );
}
