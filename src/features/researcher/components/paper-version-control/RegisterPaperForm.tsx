import { FileDropzone } from "@/src/shared/components/FileDropzone";
import { STUDY_TYPE_OPTIONS, PAPER_LIMITS } from "@/src/features/researcher/config/upload";
import type { UseUploadReturn } from "@/src/features/researcher/hooks/useUpload";
import type { StudyTypeDb } from "@/src/shared/lib/db/schema";
import type { UploadValidationErrors } from "@/src/features/researcher/reducers/upload";

interface RegisterPaperFormProps {
  upload: UseUploadReturn;
  uploadErrors: UploadValidationErrors;
  onRegister: () => void;
  onReset: () => void;
}

export function RegisterPaperForm({
  upload,
  uploadErrors,
  onRegister,
  onReset,
}: RegisterPaperFormProps) {
  const isFormBusy = upload.isRegistering || upload.isHashing;

  if (upload.registered) {
    return (
      <div
        className="rounded-md p-4 text-center"
        style={{ background: "rgba(143,188,143,0.08)", border: "1px solid rgba(143,188,143,0.2)" }}
      >
        <div className="text-[14px] text-[#8fbc8f] mb-2">Paper registered successfully</div>
        <div className="text-[12px] text-[#b0a898] mb-3">
          &ldquo;{upload.title}&rdquo; has been added to your repository.
        </div>
        {upload.fileHash && (
          <div className="text-[11px] text-[#8a8070] mt-1">
            A unique digital fingerprint has been recorded and timestamped on the blockchain for this file.
          </div>
        )}
        <button
          onClick={onReset}
          className="mt-4 ml-auto block cursor-pointer rounded-md px-4 py-2 text-[13px] font-medium text-[#c9a44a] transition-colors hover:text-[#d4b45a]"
          style={{ background: "rgba(201,164,74,0.1)", border: "1px solid rgba(201,164,74,0.25)" }}
        >
          Register another paper
        </button>
      </div>
    );
  }

  return (
    <>
      {/* PDF Upload */}
      <div className="mb-[18px]">
        <label className="input-label">
          Paper File (PDF) <span className="text-[#d4645a]">*</span>
        </label>
        <FileDropzone
          accept=".pdf"
          label="Click to upload PDF"
          onFileSelect={upload.handleFileSelect}
          fileName={upload.fileName}
          hash={upload.fileHash}
          isHashing={upload.isHashing}
          onRemove={upload.removeFile}
          error={uploadErrors.file}
          disabled={isFormBusy}
        />
      </div>

      {/* Title */}
      <div className="mb-[18px]">
        <label className="input-label">
          Title <span className="text-[#d4645a]">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter paper title..."
          value={upload.title}
          onChange={(e) => upload.setTitle(e.target.value)}
          disabled={isFormBusy}
          className={`input-field ${uploadErrors.title ? "input-error" : ""} ${isFormBusy ? "opacity-50" : ""}`}
        />
        {uploadErrors.title && (
          <div className="text-[10px] text-[#d4645a] mt-1">{uploadErrors.title}</div>
        )}
      </div>

      {/* Abstract */}
      <div className="mb-[18px]">
        <label className="input-label">
          Abstract <span className="text-[#d4645a]">*</span>
        </label>
        <textarea
          placeholder="Enter abstract..."
          value={upload.abstract}
          onChange={(e) => upload.setAbstract(e.target.value)}
          disabled={isFormBusy}
          rows={5}
          className={`input-field resize-y leading-[1.6] ${uploadErrors.abstract ? "input-error" : ""} ${isFormBusy ? "opacity-50" : ""}`}
        />
        {uploadErrors.abstract && (
          <div className="text-[10px] text-[#d4645a] mt-1">{uploadErrors.abstract}</div>
        )}
      </div>

      {/* Study Type */}
      <div className="mb-[18px]">
        <label className="input-label">Study Type</label>
        <select
          value={upload.studyType}
          onChange={(e) => upload.setStudyType(e.target.value as StudyTypeDb)}
          disabled={isFormBusy}
          className="w-full rounded-[6px] px-3 py-2 text-[12px] font-serif text-[#d4ccc0] outline-none cursor-pointer"
          style={{
            background: "rgba(30,28,24,0.6)",
            border: "1px solid rgba(120,110,95,0.2)",
            padding: "10px 14px",
            fontSize: 13,
            ...(isFormBusy ? { opacity: 0.5 } : {}),
          }}
        >
          {STUDY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Keywords */}
      <div className="mb-[18px]">
        <label className="input-label">
          Keywords
          <span className="ml-2 text-[10px] text-[#6a6050]">
            {upload.keywords.length}/{PAPER_LIMITS.keywords.max}
          </span>
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {upload.keywords.map((k, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] text-[#b0a898]"
              style={{
                background: "rgba(120,110,95,0.12)",
                border: "1px solid rgba(120,110,95,0.2)",
              }}
            >
              {k}
              <span
                onClick={isFormBusy ? undefined : () => upload.removeKeyword(i)}
                className={`text-[#6a6050] text-[13px] ${isFormBusy ? "" : "cursor-pointer"}`}
                style={isFormBusy ? { opacity: 0.5 } : undefined}
              >
                {"\u2715"}
              </span>
            </span>
          ))}
        </div>
        {upload.keywords.length < PAPER_LIMITS.keywords.max && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add keyword..."
              value={upload.keywordInput}
              onChange={(e) => upload.setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && upload.keywordInput.trim()) upload.addKeyword();
              }}
              disabled={isFormBusy}
              className={`input-field flex-1 ${isFormBusy ? "opacity-50" : ""}`}
            />
            <button
              onClick={upload.addKeyword}
              disabled={isFormBusy}
              className="rounded py-0 px-4 text-[#8a8070] text-xs cursor-pointer font-serif"
              style={{
                background: "rgba(120,110,95,0.1)",
                border: "1px solid rgba(120,110,95,0.2)",
                ...(isFormBusy ? { opacity: 0.5 } : {}),
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Register Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRegister}
          disabled={isFormBusy}
          className="px-6 py-2.5 rounded-md text-[13px] font-medium cursor-pointer transition-colors"
          style={{
            background: "rgba(201,164,74,0.15)",
            color: "#c9a44a",
            border: "1px solid rgba(201,164,74,0.3)",
            opacity: isFormBusy ? 0.5 : 1,
          }}
        >
          {upload.isRegistering ? "Registering..." : "Register Paper"}
        </button>
      </div>
    </>
  );
}
