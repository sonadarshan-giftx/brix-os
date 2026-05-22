import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Check } from 'lucide-react';

interface FileUploadProps {
  onUpload?: (files: File[]) => void;
  maxSize?: number; // MB
  accept?: string;
}

export function FileUpload({ onUpload, maxSize = 50, accept = '*' }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const valid = dropped.filter((f) => f.size <= maxSize * 1024 * 1024);
    setFiles((prev) => [...prev, ...valid]);
  }, [maxSize]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => f.size <= maxSize * 1024 * 1024);
    setFiles((prev) => [...prev, ...valid]);
  }, [maxSize]);

  const uploadFiles = useCallback(async () => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json();
        setUploaded(result.urls || []);
        onUpload?.(files);
        setFiles([]);
      }
    } catch {
      // Silent fail - files stay in state for retry
    }
  }, [files, onUpload]);

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors"
        style={{
          borderColor: isDragging ? '#5b5fc7' : '#d1d1d1',
          backgroundColor: isDragging ? 'var(--surface-selected)' : 'var(--surface-hover)',
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload size={24} color="#8a8a8a" />
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Drop files here or click to browse
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Max {maxSize}MB per file
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between rounded-lg border p-2"
                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-hover)' }}
              >
                <div className="flex items-center gap-2">
                  <File size={14} color="#8a8a8a" />
                  <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="cursor-pointer p-1">
                  <X size={12} color="#8a8a8a" />
                </button>
              </motion.div>
            ))}
            <button
              onClick={uploadFiles}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded py-2 text-sm font-medium text-white"
              style={{ backgroundColor: '#5b5fc7', border: 'none' }}
            >
              <Check size={14} /> Upload {files.length} file{files.length !== 1 ? 's' : ''}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {uploaded.length > 0 && (
        <div className="rounded-lg p-3" style={{ backgroundColor: '#dcfce7' }}>
          <p className="text-xs font-medium" style={{ color: '#237b4b' }}>
            <Check size={12} className="inline mr-1" />
            {uploaded.length} file{uploaded.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
      )}
    </div>
  );
}
