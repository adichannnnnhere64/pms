import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AttachmentPreviewFile {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

interface AttachmentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: AttachmentPreviewFile | null;
}

function getFileExtension(file?: AttachmentPreviewFile | null): string {
  if (!file?.name) return '';
  const parts = file.name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

type AttachmentRenderer = {
  name: string;
  canPreview: (file: AttachmentPreviewFile) => boolean;
  render: (file: AttachmentPreviewFile, onError: () => void) => React.ReactNode;
};

const attachmentRenderers: AttachmentRenderer[] = [
  {
    name: 'image',
    canPreview: (file) =>
      file.type?.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(getFileExtension(file)),
    render: (file, onError) => (
      <img
        src={file.url}
        alt={file.name}
        className="mx-auto max-h-[64vh] object-contain"
        onError={onError}
      />
    ),
  },
  {
    name: 'pdf',
    canPreview: (file) =>
      file.type === 'application/pdf' || getFileExtension(file) === 'pdf',
    render: (file) => (
      <iframe title={file.name} src={file.url} className="h-[64vh] w-full rounded" />
    ),
  },
  {
    name: 'office',
    canPreview: (file) =>
      [
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
      ].includes(getFileExtension(file)),
    render: (file) => (
      <iframe title={file.name} src={file.url} className="h-[64vh] w-full rounded" />
    ),
  },
  // Add future renderers here (e.g. docx, xlsx) without touching consumers.
];

export function AttachmentPreviewDialog({
  open,
  onOpenChange,
  file,
}: AttachmentPreviewDialogProps) {
  const [previewError, setPreviewError] = useState(false);
  const renderer = useMemo(() => {
    if (!file) return null;
    return attachmentRenderers.find((item) => item.canPreview(file)) ?? null;
  }, [file]);

  useEffect(() => {
    setPreviewError(false);
  }, [file?.url, file?.name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Attachment Preview</DialogTitle>
          <DialogDescription className="truncate">
            {file?.name ?? 'No file selected'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto rounded border bg-muted/30 p-2">
          {file ? (
            renderer && !previewError ? (
              renderer.render(file, () => setPreviewError(true))
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <span>Preview not available for this file type.</span>
                <span>Please download to view.</span>
              </div>
            )
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No file selected.
            </div>
          )}
        </div>
        <DialogFooter>
          {file && (
            <Button variant="secondary" asChild>
              <a href={file.url} download>
                Download
              </a>
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
