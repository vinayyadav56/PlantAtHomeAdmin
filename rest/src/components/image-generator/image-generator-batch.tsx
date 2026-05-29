import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'next-i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { UploadIcon } from '@/components/icons/upload-icon';
import Select from '@/components/ui/select/select';
import Label from '@/components/ui/label';
import Button from '@/components/ui/button';
import { useGenerateBatchMutation, useImageServiceOptionsQuery } from '@/data/image-generator';
import { BatchGenerateResult, BatchRowResult, Background, Resolution, Quality, ImageStyle } from '@/data/client/image-generator';

type BatchDefaults = {
  resolution: Resolution;
  quality: Quality;
  style: ImageStyle;
  background: Background;
};

export default function ImageGeneratorBatch() {
  const { t } = useTranslation('common');
  const [batchResults, setBatchResults] = useState<BatchGenerateResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data: optionsData } = useImageServiceOptionsQuery();
  const options = optionsData?.data;

  const { mutate: generateBatch, isLoading } = useGenerateBatchMutation();

  const { setValue, watch } = useForm<BatchDefaults>({
    defaultValues: { resolution: '1024x1024', quality: 'hd', style: 'natural', background: 'white' },
  });
  const defaults = watch();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: isLoading,
  });

  function handleSubmit() {
    if (!file) {
      toast.error(t('text-please-upload-excel'));
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resolution', defaults.resolution);
    formData.append('quality', defaults.quality);
    formData.append('style', defaults.style);
    formData.append('background', defaults.background);

    generateBatch(formData, {
      onSuccess: (res) => {
        setBatchResults(res.data);
        toast.success(
          t('text-batch-complete', { succeeded: res.data.succeeded, total: res.data.total })
        );
      },
    });
  }

  const resolutionOptions = (options?.resolutions ?? ['1024x1024', '1792x1024', '1024x1792']).map((r) => ({ value: r, label: r }));
  const qualityOptions = (options?.qualities ?? ['standard', 'hd']).map((q) => ({ value: q, label: q === 'hd' ? 'HD' : 'Standard' }));
  const styleOptions = (options?.styles ?? ['vivid', 'natural']).map((s) => ({ value: s, label: s }));
  const backgroundOptions = (options?.backgrounds ?? ['white', 'transparent', 'natural', 'studio', 'gradient']).map((b) => ({ value: b, label: b }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-heading">{t('text-batch-image-generation')}</h2>
          <p className="mt-1 text-sm text-body">{t('text-batch-description')}</p>
        </div>
        <a
          href="/templates/image-generator-template.xlsx"
          download
          className="shrink-0 rounded border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white transition-colors"
        >
          {t('text-download-template')}
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>{t('form:input-label-resolution')}</Label>
          <Select options={resolutionOptions} defaultValue={resolutionOptions[0]} onChange={(o: any) => setValue('resolution', o?.value)} isDisabled={isLoading} />
        </div>
        <div>
          <Label>{t('form:input-label-quality')}</Label>
          <Select options={qualityOptions} defaultValue={qualityOptions.find((o) => o.value === 'hd')} onChange={(o: any) => setValue('quality', o?.value)} isDisabled={isLoading} />
        </div>
        <div>
          <Label>{t('form:input-label-style')}</Label>
          <Select options={styleOptions} defaultValue={styleOptions.find((o) => o.value === 'natural')} onChange={(o: any) => setValue('style', o?.value)} isDisabled={isLoading} />
        </div>
        <div>
          <Label>{t('form:input-label-background')}</Label>
          <Select options={backgroundOptions} defaultValue={backgroundOptions[0]} onChange={(o: any) => setValue('background', o?.value)} isDisabled={isLoading} />
        </div>
      </div>

      <div
        {...getRootProps({
          className: `border-dashed border-2 rounded-lg flex flex-col justify-center items-center cursor-pointer p-8 transition-colors ${
            isDragActive ? 'border-accent bg-accent/5' : 'border-border-base hover:border-accent'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`,
        })}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-t-2 border-transparent" style={{ borderTopColor: 'rgb(var(--color-accent))' }} />
        ) : (
          <UploadIcon className="text-muted-light" />
        )}
        <p className="mt-3 text-center text-sm text-body">
          {isLoading ? (
            <span className="font-semibold text-accent">{t('text-generating-images')}</span>
          ) : file ? (
            <>
              <span className="font-semibold text-accent">{file.name}</span>
              <span className="block text-xs text-muted mt-1">{t('text-click-to-replace')}</span>
            </>
          ) : (
            <>
              <span className="font-semibold text-accent">{t('text-drop-excel-here')}</span>
              <span className="block text-xs text-muted mt-1">{t('text-supports-xlsx-csv')}</span>
            </>
          )}
        </p>
      </div>

      <Button onClick={handleSubmit} loading={isLoading} disabled={isLoading || !file}>
        {t('form:button-label-generate-batch')}
      </Button>

      {batchResults && <BatchResultsTable results={batchResults} />}
    </div>
  );
}

function BatchResultsTable({ results }: { results: BatchGenerateResult }) {
  const { t } = useTranslation('common');

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-4">
        <h3 className="text-base font-semibold text-heading">{t('text-batch-results')}</h3>
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          {results.succeeded}/{results.total} {t('text-succeeded')}
        </span>
        {results.failed > 0 && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {results.failed} {t('text-failed')}
          </span>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border-base">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-heading">{t('text-plant-name')}</th>
              <th className="px-4 py-3 font-medium text-heading">{t('text-status')}</th>
              <th className="px-4 py-3 font-medium text-heading">{t('text-image')}</th>
              <th className="px-4 py-3 font-medium text-heading">{t('text-actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {results.results.map((row: BatchRowResult, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-heading">{row.plant_name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${row.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.status === 'success' ? t('text-success') : t('text-failed')}
                  </span>
                  {row.error && <p className="mt-1 text-xs text-red-500">{row.error}</p>}
                </td>
                <td className="px-4 py-3">
                  {row.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.url} alt={row.plant_name} className="h-16 w-16 rounded object-cover" />
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.url && (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent hover:underline"
                    >
                      {t('text-open')}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
