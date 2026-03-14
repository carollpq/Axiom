'use client';

import dynamic from 'next/dynamic';
import type { PdfViewerProps } from './pdf-viewer.client';

const DynamicPdfViewer = dynamic<PdfViewerProps>(
  () => import('@/src/shared/components/pdf-viewer.client'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-[12px] text-[#6a6050] font-serif">
        Loading PDF viewer...
      </div>
    ),
  },
);

export { DynamicPdfViewer };
