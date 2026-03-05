"use client";

import { useReducer, useCallback, useRef } from "react";
import { useCurrentUser } from "@/src/shared/hooks/useCurrentUser";
import { fetchApi } from "@/src/shared/lib/api";
import { hashFile } from "@/src/shared/lib/hashing";
import { isLitConfigured, getLitClient } from "@/src/shared/lib/lit/client";
import { buildWalletListConditions } from "@/src/shared/lib/lit/access-control";
import { encryptFileWithLit } from "@/src/shared/lib/lit/encrypt";
import { uploadToIPFS } from "@/src/shared/lib/upload";
import type { ApiPaperVersion } from "@/src/shared/types/api";
import {
  uploadReducer,
  initialUploadState,
  validateUpload,
} from "@/src/features/researcher/reducers/upload";
import type { Visibility } from "@/src/features/researcher/types/paper-registration";
import type { StudyTypeDb } from "@/src/shared/lib/db/schema";

async function encryptFileIfConfigured(
  file: File,
  fileHash: string,
  walletAddress: string | undefined,
): Promise<{
  fileToUpload: File;
  uploadHash: string;
  litDataToEncryptHash: string | null;
  litAccessConditionsJson: string | null;
}> {
  if (!isLitConfigured() || !walletAddress) {
    return { fileToUpload: file, uploadHash: fileHash, litDataToEncryptHash: null, litAccessConditionsJson: null };
  }

  try {
    await getLitClient();
    const conditions = buildWalletListConditions([walletAddress]);
    const encrypted = await encryptFileWithLit(file, conditions);
    const encryptedFile = new File(
      [encrypted.ciphertext],
      file.name + ".enc",
      { type: "application/octet-stream" },
    );
    const uploadHash = await hashFile(encryptedFile);
    return {
      fileToUpload: encryptedFile,
      uploadHash,
      litDataToEncryptHash: encrypted.dataToEncryptHash,
      litAccessConditionsJson: encrypted.accessConditionsJson,
    };
  } catch (litErr) {
    console.warn("[Lit] Encryption skipped:", litErr);
    return { fileToUpload: file, uploadHash: fileHash, litDataToEncryptHash: null, litAccessConditionsJson: null };
  }
}

export function useUpload(onRegistered?: (paperId: string, title: string) => void) {
  const { user, isConnected, account } = useCurrentUser();
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState);
  const uploadedFileRef = useRef<File | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    dispatch({ type: "FILE_UPLOAD_START", fileName: file.name });
    uploadedFileRef.current = file;
    try {
      const hash = await hashFile(file);
      dispatch({ type: "FILE_UPLOAD_COMPLETE", fileHash: hash });
    } catch {
      dispatch({ type: "FILE_UPLOAD_ERROR" });
    }
  }, []);

  const removeFile = useCallback(() => {
    dispatch({ type: "REMOVE_FILE" });
    uploadedFileRef.current = null;
  }, []);

  const addKeyword = useCallback(() => dispatch({ type: "ADD_KEYWORD" }), []);
  const removeKeyword = useCallback((index: number) => dispatch({ type: "REMOVE_KEYWORD", index }), []);

  const register = async () => {
    if (!isConnected || !user) return;

    const errors = validateUpload(state);
    if (Object.keys(errors).length > 0) return;

    dispatch({ type: "REGISTER_START" });
    try {
      const uploadedFile = uploadedFileRef.current;
      if (!uploadedFile || !state.fileHash) {
        throw new Error("No file uploaded");
      }

      const { fileToUpload, uploadHash, litDataToEncryptHash, litAccessConditionsJson } =
        await encryptFileIfConfigured(uploadedFile, state.fileHash, account?.address);

      const fileStorageKey = await uploadToIPFS(fileToUpload, uploadHash, "papers");

      const paper = await fetchApi<{ id: string }>("/api/papers", {
        method: "POST",
        body: JSON.stringify({
          title: state.title,
          abstract: state.abstract,
          studyType: state.studyType,
          litDataToEncryptHash,
          litAccessConditionsJson,
        }),
      });

      await fetchApi<ApiPaperVersion>(
        `/api/papers/${paper.id}/versions`,
        {
          method: "POST",
          body: JSON.stringify({
            paperHash: state.fileHash,
            fileStorageKey,
            datasetHash: null,
            codeRepoUrl: null,
            codeCommitHash: null,
            envSpecHash: null,
          }),
        },
      );

      await fetchApi(`/api/papers/${paper.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "registered", visibility: state.visibility }),
      });

      dispatch({ type: "REGISTER_SUCCESS", paperId: paper.id });
      onRegistered?.(paper.id, state.title);
    } catch (err) {
      console.error("Registration failed:", err);
      dispatch({
        type: "REGISTER_ERROR",
        error: err instanceof Error ? err.message : "Registration failed",
      });
    }
  };

  return {
    title: state.title,
    setTitle: (title: string) => dispatch({ type: "SET_TITLE", title }),
    abstract: state.abstract,
    setAbstract: (abstract: string) => dispatch({ type: "SET_ABSTRACT", abstract }),
    fileName: state.fileName,
    fileHash: state.fileHash,
    isHashing: state.isHashing,
    handleFileSelect,
    removeFile,
    studyType: state.studyType,
    setStudyType: (studyType: StudyTypeDb) => dispatch({ type: "SET_STUDY_TYPE", studyType }),
    visibility: state.visibility,
    setVisibility: (visibility: Visibility) => dispatch({ type: "SET_VISIBILITY", visibility }),
    keywords: state.keywords,
    keywordInput: state.keywordInput,
    setKeywordInput: (v: string) => dispatch({ type: "SET_KEYWORD_INPUT", keywordInput: v }),
    addKeyword,
    removeKeyword,
    register,
    isRegistering: state.registering,
    registeredPaperId: state.paperId,
    registered: state.registered,
    error: state.error,
    reset: () => { dispatch({ type: "RESET" }); uploadedFileRef.current = null; },
  };
}
