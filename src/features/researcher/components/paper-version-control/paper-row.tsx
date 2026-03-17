import { ChevronRight, ChevronDown, Download, Upload } from 'lucide-react';
import { formatDate } from '@/src/shared/lib/format';
import type { PaperWithVersions } from './types';

interface PaperRowProps {
  paper: PaperWithVersions;
  isExpanded: boolean;
  isUploading: boolean;
  onToggle: () => void;
  onDownload: (paperId: string, versionId: string) => void;
  onUploadClick: (paperId: string) => void;
}

export function PaperRow({
  paper,
  isExpanded,
  isUploading,
  onToggle,
  onDownload,
  onUploadClick,
}: PaperRowProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-md text-left cursor-pointer transition-colors"
        style={{
          background: isExpanded ? 'rgba(45,42,38,0.7)' : 'rgba(45,42,38,0.4)',
          border: '1px solid rgba(120,110,95,0.2)',
        }}
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-[#8a8070] shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-[#8a8070] shrink-0" />
        )}
        <span className="text-[14px] font-serif text-[#e8e0d4] truncate flex-1 min-w-0">
          {paper.title}
        </span>
        <span className="ml-auto text-[11px] text-[#6a6050]">
          {paper.versions.length} version
          {paper.versions.length !== 1 ? 's' : ''}
        </span>
      </button>

      {isExpanded && (
        <div
          className="ml-8 mt-1 mb-2 flex flex-col gap-1"
          style={{ borderLeft: '2px solid rgba(120,110,95,0.15)' }}
        >
          {paper.versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-4 px-5 py-3"
              style={{
                background: 'rgba(45,42,38,0.3)',
              }}
            >
              <span className="text-[13px] text-[#b0a898]">
                Version {v.versionNumber}
              </span>
              <span className="text-[11px] text-[#6a6050] ml-auto">
                {formatDate(v.createdAt)}
              </span>
              <button
                type="button"
                onClick={() => onDownload(paper.id, v.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium cursor-pointer"
                style={{
                  background: 'rgba(90,122,154,0.15)',
                  color: '#5a7a9a',
                  border: '1px solid rgba(90,122,154,0.25)',
                }}
              >
                <Download size={12} />
                Download PDF
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onUploadClick(paper.id)}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-3 cursor-pointer"
            style={{
              background: 'rgba(201,164,74,0.08)',
              opacity: isUploading ? 0.5 : 1,
            }}
          >
            <Upload size={14} className="text-[#c9a44a]" />
            <span className="text-[12px] text-[#c9a44a]">
              {isUploading ? 'Uploading...' : 'Upload a New Version'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
