'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCurrentUser } from '@/src/shared/hooks/useCurrentUser';
import { hashString, canonicalJson } from '@/src/shared/lib/hashing';
import { signContractAction } from '@/src/features/contracts/actions';

interface ContractContributor {
  name: string;
  role: string;
  pct: number;
  status: string;
  wallet: string;
}

interface ContractForSigning {
  id: string;
  paperTitle: string;
  contributors: ContractContributor[];
}

interface Props {
  contracts: ContractForSigning[];
  currentWallet: string;
}

export function ContractsToSign({ contracts, currentWallet }: Props) {
  const { account } = useCurrentUser();
  const router = useRouter();
  const [signing, setSigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleSign = async (contractId: string) => {
    if (!account) return;
    setSigning(contractId);
    setError(null);

    try {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;

      const payload = {
        paperTitle: contract.paperTitle,
        contributors: contract.contributors.map((c) => ({
          wallet: c.wallet,
          name: c.name,
          pct: c.pct,
          role: c.role,
        })),
      };
      const contractHash = await hashString(canonicalJson(payload));
      const signature = await account.signMessage({ message: contractHash });

      await signContractAction({
        contractId,
        contributorWallet: currentWallet,
        signature,
        contractHash,
      });

      setDismissed((prev) => new Set(prev).add(contractId));
      router.refresh();
      toast.success('Contract signed successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signing failed';
      setError(message);
      toast.error(message);
    } finally {
      setSigning(null);
    }
  };

  const handleReject = (contractId: string) => {
    setDismissed((prev) => new Set(prev).add(contractId));
  };

  const visibleContracts = contracts.filter((c) => !dismissed.has(c.id));

  if (visibleContracts.length === 0) {
    return (
      <div
        className="rounded-md px-6 py-10 text-center text-[13px] text-[#6a6050]"
        style={{
          background: 'rgba(45,42,38,0.4)',
          border: '1px solid rgba(120,110,95,0.15)',
        }}
      >
        No contracts to sign at the moment.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div
          className="rounded-md px-4 py-3 text-[13px]"
          style={{
            background: 'rgba(212,100,90,0.15)',
            color: '#d4645a',
            border: '1px solid rgba(212,100,90,0.3)',
          }}
        >
          {error}
        </div>
      )}

      {visibleContracts.map((contract) => (
        <div
          key={contract.id}
          className="rounded-md p-5"
          style={{
            background: 'rgba(45,42,38,0.5)',
            border: '1px solid rgba(120,110,95,0.2)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-[15px] font-serif text-[#e8e0d4] mb-2">
                {contract.paperTitle}
              </h3>
              <div className="flex flex-col gap-1">
                {contract.contributors.map((c, idx) => (
                  <p key={idx} className="text-[12px] text-[#8a8070]">
                    {c.name} &mdash; {c.role} &mdash; {c.pct}%
                  </p>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSign(contract.id)}
                disabled={signing === contract.id}
                className="px-4 py-2 rounded text-[12px] font-medium cursor-pointer"
                style={{
                  background: 'rgba(143,188,143,0.2)',
                  color: '#8fbc8f',
                  border: '1px solid rgba(143,188,143,0.3)',
                  opacity: signing === contract.id ? 0.5 : 1,
                }}
              >
                {signing === contract.id ? 'Signing...' : 'Sign Contract'}
              </button>
              <button
                type="button"
                onClick={() => handleReject(contract.id)}
                className="px-4 py-2 rounded text-[12px] font-medium cursor-pointer"
                style={{
                  background: 'rgba(212,100,90,0.15)',
                  color: '#d4645a',
                  border: '1px solid rgba(212,100,90,0.3)',
                }}
              >
                Reject Contract
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ContractsToSign;
