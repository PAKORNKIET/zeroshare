'use client';

import { useI18n } from '@/components/I18nProvider';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A file input whose button and empty-state text follow the site language
 * (the browser's native "Choose File / No file chosen" can't be translated).
 */
export default function FilePicker({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const { t } = useI18n();

  return (
    <label className="filepick">
      <input
        type="file"
        className="visually-hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <span className="filepick-btn">{t('picker.choose')}</span>
      <span className={`filepick-name ${file ? '' : 'empty'}`}>
        {file ? file.name : t('picker.none')}
      </span>
      {file && <span className="filepick-size">{formatSize(file.size)}</span>}
    </label>
  );
}
