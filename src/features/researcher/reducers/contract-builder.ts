import type { Contributor } from "@/src/features/researcher/types/contract";

export interface ContractBuilderState {
  selectedDraft: number | null;
  newTitle: string;
  contributors: Contributor[];
  showAddRow: boolean;
  addWallet: string;
  showPreview: boolean;
  showInviteModal: boolean;
  inviteLink: string;
  selectedContractId: string | null;
}

export const initialState: ContractBuilderState = {
  selectedDraft: null,
  newTitle: "",
  contributors: [],
  showAddRow: false,
  addWallet: "",
  showPreview: false,
  showInviteModal: false,
  inviteLink: "",
  selectedContractId: null,
};

export type ContractBuilderAction =
  | { type: "SET_SELECTED_DRAFT"; selectedDraft: number | null }
  | { type: "SELECT_DRAFT_LOADED"; contributors: Contributor[]; selectedContractId: string | null }
  | { type: "SET_NEW_TITLE"; newTitle: string }
  | { type: "SET_CONTRIBUTORS"; contributors: Contributor[] }
  | { type: "UPDATE_CONTRIBUTOR"; id: number; field: string; value: string | number }
  | { type: "REMOVE_CONTRIBUTOR"; id: number }
  | { type: "ADD_CONTRIBUTOR"; contributor: Contributor }
  | { type: "CONTRIBUTOR_ADDED_CLEAR" }
  | { type: "SET_SHOW_ADD_ROW"; showAddRow: boolean }
  | { type: "SET_ADD_WALLET"; addWallet: string }
  | { type: "SET_SHOW_PREVIEW"; showPreview: boolean }
  | { type: "SHOW_INVITE_MODAL"; inviteLink: string }
  | { type: "CLOSE_INVITE_MODAL" }
  | { type: "SET_SELECTED_CONTRACT_ID"; selectedContractId: string | null }
  | { type: "SIGN_DEMO"; id: number; txHash: string; signedAt: string }
  | { type: "CONTRACT_CREATED"; selectedContractId: string; contributorDbIds: (string | undefined)[] };

export function contractBuilderReducer(
  state: ContractBuilderState,
  action: ContractBuilderAction,
): ContractBuilderState {
  switch (action.type) {
    case "SET_SELECTED_DRAFT":
      return { ...state, selectedDraft: action.selectedDraft };

    case "SELECT_DRAFT_LOADED":
      return {
        ...state,
        contributors: action.contributors,
        selectedContractId: action.selectedContractId,
      };

    case "SET_NEW_TITLE":
      return { ...state, newTitle: action.newTitle };

    case "SET_CONTRIBUTORS":
      return { ...state, contributors: action.contributors };

    case "UPDATE_CONTRIBUTOR": {
      const hasSigned = state.contributors.some((c) => c.status === "signed");
      return {
        ...state,
        contributors: state.contributors.map((c) => {
          if (c.id !== action.id) {
            if (hasSigned && c.status === "signed") {
              return { ...c, status: "pending" as const, txHash: null, signedAt: null };
            }
            return c;
          }
          return {
            ...c,
            [action.field]: action.field === "pct" ? (action.value === "" ? "" : Number(action.value)) : action.value,
            ...(hasSigned && c.status === "signed"
              ? { status: "pending" as const, txHash: null, signedAt: null }
              : {}),
          };
        }),
      };
    }

    case "REMOVE_CONTRIBUTOR":
      return {
        ...state,
        contributors: state.contributors.filter((c) => c.id !== action.id),
      };

    case "ADD_CONTRIBUTOR":
      return {
        ...state,
        contributors: [...state.contributors, action.contributor],
        addWallet: "",
        showAddRow: false,
      };

    case "CONTRIBUTOR_ADDED_CLEAR":
      return { ...state, addWallet: "", showAddRow: false };

    case "SET_SHOW_ADD_ROW":
      return { ...state, showAddRow: action.showAddRow };

    case "SET_ADD_WALLET":
      return { ...state, addWallet: action.addWallet };

    case "SET_SHOW_PREVIEW":
      return { ...state, showPreview: action.showPreview };

    case "SHOW_INVITE_MODAL":
      return { ...state, showInviteModal: true, inviteLink: action.inviteLink };

    case "CLOSE_INVITE_MODAL":
      return { ...state, showInviteModal: false };

    case "SET_SELECTED_CONTRACT_ID":
      return { ...state, selectedContractId: action.selectedContractId };

    case "SIGN_DEMO":
      return {
        ...state,
        contributors: state.contributors.map((c) =>
          c.id === action.id
            ? { ...c, status: "signed" as const, txHash: action.txHash, signedAt: action.signedAt }
            : c,
        ),
      };

    case "CONTRACT_CREATED":
      return {
        ...state,
        selectedContractId: action.selectedContractId,
        contributors: state.contributors.map((c, i) => ({
          ...c,
          dbId: action.contributorDbIds[i] ?? c.dbId,
        })),
      };

    default:
      return state;
  }
}

export function selectTotalPct(state: ContractBuilderState): number {
  return state.contributors.reduce((s, c) => s + (Number(c.pct) || 0), 0);
}

export function selectIsValid(state: ContractBuilderState): boolean {
  return selectTotalPct(state) === 100;
}

export function selectAllSigned(state: ContractBuilderState): boolean {
  return state.contributors.length > 0 && state.contributors.every((c) => c.status === "signed");
}

export function selectHasSigned(state: ContractBuilderState): boolean {
  return state.contributors.some((c) => c.status === "signed");
}
