import { useTranslation } from 'next-i18next';
import { toast } from 'react-toastify';
import { GenerateImageResult } from '@/data/client/image-generator';
import { useUploadMutation } from '@/data/upload';

interface Props {
  results: GenerateImageResult[];
}

async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank');
  }
}

export default function ImageGeneratorResults({ results }: Props) {
  const { t } = useTranslation('common');
  const { mutate: uploadFile, isLoading: isUploading } = useUploadMutation();

  async function handleSaveToMedia(url: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = `generated-plant-${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      const formData = new FormData();
      formData.append('attachment[]', file);

      uploadFile(formData, {
        onSuccess: () => toast.success(t('text-image-saved-to-media')),
        onError: () => toast.error(t('error-something-wrong')),
      });
    } catch {
      toast.error(t('error-something-wrong'));
    }
  }

  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-heading">{t('text-generated-images')} ({results.length})</h3>
      <p className="mb-4 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
        ⏱ {t('text-image-url-expiry-warning')}
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result, idx) => (
          <div key={idx} className="overflow-hidden rounded-lg border border-border-base bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={`Generated plant image ${idx + 1}`}
              className="h-64 w-full object-cover"
            />
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted line-clamp-2" title={result.revised_prompt}>
                {result.revised_prompt}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadImage(result.url, `plant-image-${Date.now()}.png`)}
                  className="rounded border border-accent px-3 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-white transition-colors"
                >
                  {t('text-download')}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.url);
                    toast.success(t('text-copied-to-clipboard'));
                  }}
                  className="rounded border border-border-base px-3 py-1 text-xs font-medium text-body hover:bg-gray-50 transition-colors"
                >
                  {t('text-copy-url')}
                </button>
                <button
                  onClick={() => handleSaveToMedia(result.url)}
                  disabled={isUploading}
                  className="rounded bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {t('text-save-to-media')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
