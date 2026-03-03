import type { Visibility } from "@/src/features/researcher/types/paper-registration";
import type { StudyTypeDb } from "@/src/shared/lib/db/schema";

export interface PaperRegistrationState {
  // Navigation
  step: number;

  // Step 1: Paper Details
  title: string;
  abstract: string;
  fileName: string;
  fileHash: string;
  visibility: Visibility;
  studyType: StudyTypeDb;
  keywords: string[];
  keywordInput: string;
  isHashing: boolean;

  // Step 2: Provenance
  datasetHash: string;
  datasetUrl: string;
  codeRepo: string;
  codeCommit: string;
  envHash: string;
  githubConnected: boolean;

  // Step 3: Contract
  selectedContract: number | null;

  // Step 4: Confirmation
  registered: boolean;
  submitted: boolean;
  selectedJournal: string | null;
  paperId: string | null;
  txHash: string;
  txTimestamp: string;
  registering: boolean;
}

export const initialState: PaperRegistrationState = {
  step: 0,
  title: "",
  abstract: "",
  fileName: "",
  fileHash: "",
  visibility: "private",
  studyType: "original",
  keywords: ["machine learning", "reproducibility"],
  keywordInput: "",
  isHashing: false,
  datasetHash: "",
  datasetUrl: "",
  codeRepo: "",
  codeCommit: "",
  envHash: "",
  githubConnected: false,
  selectedContract: null,
  registered: false,
  submitted: false,
  selectedJournal: null,
  paperId: null,
  txHash: "",
  txTimestamp: "",
  registering: false,
};

export type PaperRegistrationAction =
  | { type: "SET_STEP"; step: number }
  | { type: "GO_BACK" }
  | { type: "GO_NEXT" }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_ABSTRACT"; abstract: string }
  | { type: "FILE_UPLOAD_START"; fileName: string }
  | { type: "FILE_UPLOAD_COMPLETE"; fileHash: string }
  | { type: "FILE_UPLOAD_ERROR" }
  | { type: "REMOVE_FILE" }
  | { type: "SET_VISIBILITY"; visibility: Visibility }
  | { type: "SET_STUDY_TYPE"; studyType: StudyTypeDb }
  | { type: "SET_KEYWORD_INPUT"; keywordInput: string }
  | { type: "ADD_KEYWORD" }
  | { type: "REMOVE_KEYWORD"; index: number }
  | { type: "DATASET_UPLOAD_START" }
  | { type: "DATASET_UPLOAD_COMPLETE"; datasetHash: string }
  | { type: "DATASET_UPLOAD_ERROR" }
  | { type: "SET_DATASET_URL"; datasetUrl: string }
  | { type: "ENV_UPLOAD_START" }
  | { type: "ENV_UPLOAD_COMPLETE"; envHash: string }
  | { type: "ENV_UPLOAD_ERROR" }
  | { type: "SET_CODE_REPO"; codeRepo: string }
  | { type: "SET_CODE_COMMIT"; codeCommit: string }
  | { type: "SET_DATASET_HASH"; datasetHash: string }
  | { type: "SET_ENV_HASH"; envHash: string }
  | { type: "SIMULATE_GITHUB" }
  | { type: "SET_SELECTED_CONTRACT"; selectedContract: number | null }
  | { type: "SET_SELECTED_JOURNAL"; selectedJournal: string | null }
  | { type: "REGISTER_START" }
  | { type: "REGISTER_SUCCESS"; paperId: string; txHash: string; txTimestamp: string }
  | { type: "REGISTER_DEMO"; txHash: string; txTimestamp: string }
  | { type: "REGISTER_ERROR" }
  | { type: "SUBMIT_SUCCESS"; txHash: string; txTimestamp: string };

export function paperRegistrationReducer(
  state: PaperRegistrationState,
  action: PaperRegistrationAction,
): PaperRegistrationState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "GO_BACK":
      return state.step > 0 ? { ...state, step: state.step - 1 } : state;
    case "GO_NEXT":
      return state.step < 3 ? { ...state, step: state.step + 1 } : state;

    case "SET_TITLE":
      return { ...state, title: action.title };
    case "SET_ABSTRACT":
      return { ...state, abstract: action.abstract };

    case "FILE_UPLOAD_START":
      return { ...state, fileName: action.fileName, fileHash: "", isHashing: true };
    case "FILE_UPLOAD_COMPLETE":
      return { ...state, fileHash: action.fileHash, isHashing: false };
    case "FILE_UPLOAD_ERROR":
      return { ...state, isHashing: false };
    case "REMOVE_FILE":
      return { ...state, fileName: "", fileHash: "" };

    case "SET_VISIBILITY":
      return { ...state, visibility: action.visibility };
    case "SET_STUDY_TYPE":
      return { ...state, studyType: action.studyType };

    case "SET_KEYWORD_INPUT":
      return { ...state, keywordInput: action.keywordInput };
    case "ADD_KEYWORD":
      return state.keywordInput.trim()
        ? { ...state, keywords: [...state.keywords, state.keywordInput.trim()], keywordInput: "" }
        : state;
    case "REMOVE_KEYWORD":
      return { ...state, keywords: state.keywords.filter((_, j) => j !== action.index) };

    case "DATASET_UPLOAD_START":
      return { ...state, isHashing: true };
    case "DATASET_UPLOAD_COMPLETE":
      return { ...state, datasetHash: action.datasetHash, isHashing: false };
    case "DATASET_UPLOAD_ERROR":
      return { ...state, isHashing: false };
    case "SET_DATASET_URL":
      return { ...state, datasetUrl: action.datasetUrl };
    case "SET_DATASET_HASH":
      return { ...state, datasetHash: action.datasetHash };

    case "ENV_UPLOAD_START":
      return { ...state, isHashing: true };
    case "ENV_UPLOAD_COMPLETE":
      return { ...state, envHash: action.envHash, isHashing: false };
    case "ENV_UPLOAD_ERROR":
      return { ...state, isHashing: false };
    case "SET_ENV_HASH":
      return { ...state, envHash: action.envHash };

    case "SET_CODE_REPO":
      return { ...state, codeRepo: action.codeRepo };
    case "SET_CODE_COMMIT":
      return { ...state, codeCommit: action.codeCommit };

    case "SIMULATE_GITHUB":
      return {
        ...state,
        githubConnected: true,
        codeRepo: "https://github.com/areeves/transformer-reproducibility",
        codeCommit: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      };

    case "SET_SELECTED_CONTRACT":
      return { ...state, selectedContract: action.selectedContract };
    case "SET_SELECTED_JOURNAL":
      return { ...state, selectedJournal: action.selectedJournal };

    case "REGISTER_START":
      return { ...state, registering: true };
    case "REGISTER_SUCCESS":
      return {
        ...state,
        registering: false,
        registered: true,
        paperId: action.paperId,
        txHash: action.txHash,
        txTimestamp: action.txTimestamp,
      };
    case "REGISTER_DEMO":
      return {
        ...state,
        registered: true,
        txHash: action.txHash,
        txTimestamp: action.txTimestamp,
      };
    case "REGISTER_ERROR":
      return { ...state, registering: false };

    case "SUBMIT_SUCCESS":
      return {
        ...state,
        submitted: true,
        txHash: action.txHash,
        txTimestamp: action.txTimestamp,
      };

    default:
      return state;
  }
}

export function canProceedStep1(state: PaperRegistrationState): boolean {
  return !!(state.title.trim() && state.abstract.trim() && state.fileHash);
}
