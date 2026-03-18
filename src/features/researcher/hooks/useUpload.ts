'use client';

import { useReducer, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/src/shared/context/user-context.client';
import { sha256 } from '@/src/shared/lib/hashing';
import { getErrorMessage } from '@/src/shared/lib/errors';
import { isLitConfigured } from '@/src/shared/lib/lit/config';
import { uploadToIPFS } from '@/src/features/researcher/upload';
import {
  createPaperAction,
  registerVersionAction,
} from '@/src/features/papers/actions';
import {
  uploadReducer,
  initialUploadState,
  validateUpload,
} from '@/src/features/researcher/reducers/upload';
import type { StudyTypeDb } from '@/src/shared/lib/db/schema';

/** Lit-encrypts the file if configured; otherwise passes through unchanged. */
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
    return {
      fileToUpload: file,
      uploadHash: fileHash,
      litDataToEncryptHash: null,
      litAccessConditionsJson: null,
    };
  }

  try {
    const [
      { getLitClient },
      { buildWalletListConditions },
      { encryptFileWithLit },
    ] = await Promise.all([
      import('@/src/shared/lib/lit/client'),
      import('@/src/shared/lib/lit/access-control'),
      import('@/src/shared/lib/lit/encrypt'),
    ]);
    await getLitClient();
    const conditions = buildWalletListConditions([walletAddress]);
    const encrypted = await encryptFileWithLit(file, conditions);
    const encryptedFile = new File([encrypted.ciphertext], file.name + '.enc', {
      type: 'application/octet-stream',
    });
    const uploadHash = await sha256(encryptedFile);
    return {
      fileToUpload: encryptedFile,
      uploadHash,
      litDataToEncryptHash: encrypted.dataToEncryptHash,
      litAccessConditionsJson: encrypted.accessConditionsJson,
    };
  } catch (litErr) {
    console.warn('[Lit] Encryption skipped:', litErr);
    return {
      fileToUpload: file,
      uploadHash: fileHash,
      litDataToEncryptHash: null,
      litAccessConditionsJson: null,
    };
  }
}

export type UseUploadReturn = ReturnType<typeof useUpload>;

/** Manages paper registration: file hashing, optional Lit encryption, IPFS upload, and DB creation. */
export function useUpload(
  onRegistered?: (paperId: string, title: string) => void,
) {
  const { user, isConnected, account } = useUser();
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState);
  const uploadedFileRef = useRef<File | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    dispatch({ type: 'FILE_UPLOAD_START', fileName: file.name });
    uploadedFileRef.current = file;
    try {
      const hash = await sha256(file);
      dispatch({ type: 'FILE_UPLOAD_COMPLETE', fileHash: hash });
    } catch {
      dispatch({ type: 'FILE_UPLOAD_ERROR' });
    }
  }, []);

  const removeFile = useCallback(() => {
    dispatch({ type: 'REMOVE_FILE' });
    uploadedFileRef.current = null;
  }, []);

  const addKeyword = useCallback(() => dispatch({ type: 'ADD_KEYWORD' }), []);
  const removeKeyword = useCallback(
    (index: number) => dispatch({ type: 'REMOVE_KEYWORD', index }),
    [],
  );

  const register = async () => {
    if (!isConnected || !user) return;

    const errors = validateUpload(state);
    if (Object.keys(errors).length > 0) return;

    dispatch({ type: 'REGISTER_START' });
    try {
      const uploadedFile = uploadedFileRef.current;
      if (!uploadedFile || !state.fileHash) {
        throw new Error('No file uploaded');
      }

      const {
        fileToUpload,
        uploadHash,
        litDataToEncryptHash,
        litAccessConditionsJson,
      } = await encryptFileIfConfigured(
        uploadedFile,
        state.fileHash,
        account?.address,
      );

      const fileStorageKey = await uploadToIPFS(
        fileToUpload,
        uploadHash,
        'papers',
      );

      const paper = await createPaperAction({
        title: state.title,
        abstract: state.abstract,
        studyType: state.studyType,
        litDataToEncryptHash,
        litAccessConditionsJson,
      });

      await registerVersionAction({
        paperId: paper.id,
        paperHash: state.fileHash,
        fileStorageKey,
        datasetHash: null,
        codeRepoUrl: null,
        codeCommitHash: null,
        envSpecHash: null,
      });

      dispatch({ type: 'REGISTER_SUCCESS', paperId: paper.id });
      toast.success('Paper registered successfully');
      onRegistered?.(paper.id, state.title);
    } catch (err) {
      console.error('Registration failed:', err);
      const message = getErrorMessage(err, 'Registration failed');
      dispatch({ type: 'REGISTER_ERROR', error: message });
      toast.error(message);
    }
  };

  return {
    title: state.title,
    setTitle: (title: string) => dispatch({ type: 'SET_TITLE', title }),
    abstract: state.abstract,
    setAbstract: (abstract: string) =>
      dispatch({ type: 'SET_ABSTRACT', abstract }),
    fileName: state.fileName,
    fileHash: state.fileHash,
    isHashing: state.isHashing,
    handleFileSelect,
    removeFile,
    studyType: state.studyType,
    setStudyType: (studyType: StudyTypeDb) =>
      dispatch({ type: 'SET_STUDY_TYPE', studyType }),
    keywords: state.keywords,
    keywordInput: state.keywordInput,
    setKeywordInput: (v: string) =>
      dispatch({ type: 'SET_KEYWORD_INPUT', keywordInput: v }),
    addKeyword,
    removeKeyword,
    register,
    isRegistering: state.registering,
    registeredPaperId: state.paperId,
    registered: state.registered,
    error: state.error,
    reset: () => {
      dispatch({ type: 'RESET' });
      uploadedFileRef.current = null;
    },
  };
}
