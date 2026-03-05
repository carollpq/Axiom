import type { StudyTypeDb } from "@/src/shared/lib/db/schema";
import { PAPER_LIMITS } from "@/src/features/researcher/config/upload";

export interface UploadState {
  title: string;
  abstract: string;
  fileName: string;
  fileHash: string;
  isHashing: boolean;
  studyType: StudyTypeDb;
  keywords: string[];
  keywordInput: string;
  registering: boolean;
  registered: boolean;
  paperId: string | null;
  error: string | null;
}

export const initialUploadState: UploadState = {
  title: "",
  abstract: "",
  fileName: "",
  fileHash: "",
  isHashing: false,
  studyType: "original",
  keywords: [],
  keywordInput: "",
  registering: false,
  registered: false,
  paperId: null,
  error: null,
};

export type UploadAction =
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_ABSTRACT"; abstract: string }
  | { type: "FILE_UPLOAD_START"; fileName: string }
  | { type: "FILE_UPLOAD_COMPLETE"; fileHash: string }
  | { type: "FILE_UPLOAD_ERROR" }
  | { type: "REMOVE_FILE" }
  | { type: "SET_STUDY_TYPE"; studyType: StudyTypeDb }
  | { type: "SET_KEYWORD_INPUT"; keywordInput: string }
  | { type: "ADD_KEYWORD" }
  | { type: "REMOVE_KEYWORD"; index: number }
  | { type: "REGISTER_START" }
  | { type: "REGISTER_SUCCESS"; paperId: string }
  | { type: "REGISTER_ERROR"; error: string }
  | { type: "RESET" };

export function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.title };
    case "SET_ABSTRACT":
      return { ...state, abstract: action.abstract };

    case "FILE_UPLOAD_START":
      return { ...state, fileName: action.fileName, fileHash: "", isHashing: true, error: null };
    case "FILE_UPLOAD_COMPLETE":
      return { ...state, fileHash: action.fileHash, isHashing: false };
    case "FILE_UPLOAD_ERROR":
      return { ...state, isHashing: false, error: "Failed to hash file" };
    case "REMOVE_FILE":
      return { ...state, fileName: "", fileHash: "" };

    case "SET_STUDY_TYPE":
      return { ...state, studyType: action.studyType };

    case "SET_KEYWORD_INPUT":
      return { ...state, keywordInput: action.keywordInput };
    case "ADD_KEYWORD":
      return state.keywordInput.trim() && state.keywords.length < PAPER_LIMITS.keywords.max
        ? { ...state, keywords: [...state.keywords, state.keywordInput.trim()], keywordInput: "" }
        : state;
    case "REMOVE_KEYWORD":
      return { ...state, keywords: state.keywords.filter((_, j) => j !== action.index) };

    case "REGISTER_START":
      return { ...state, registering: true, error: null };
    case "REGISTER_SUCCESS":
      return { ...state, registering: false, registered: true, paperId: action.paperId };
    case "REGISTER_ERROR":
      return { ...state, registering: false, error: action.error };

    case "RESET":
      return initialUploadState;

    default:
      return state;
  }
}

export interface UploadValidationErrors {
  title?: string;
  abstract?: string;
  file?: string;
}

export function validateUpload(state: UploadState): UploadValidationErrors {
  const errors: UploadValidationErrors = {};

  const title = state.title.trim();
  if (!title) errors.title = "Title is required";
  else if (title.length < PAPER_LIMITS.title.min) errors.title = `Title must be at least ${PAPER_LIMITS.title.min} characters`;
  else if (title.length > PAPER_LIMITS.title.max) errors.title = `Title must be at most ${PAPER_LIMITS.title.max} characters`;

  const abstract = state.abstract.trim();
  if (!abstract) errors.abstract = "Abstract is required";
  else if (abstract.length < PAPER_LIMITS.abstract.min) errors.abstract = `Abstract must be at least ${PAPER_LIMITS.abstract.min} characters`;
  else if (abstract.length > PAPER_LIMITS.abstract.max) errors.abstract = `Abstract must be at most ${PAPER_LIMITS.abstract.max} characters`;

  if (!state.fileHash) errors.file = "Please upload a PDF file";

  return errors;
}
