import type { SignedContract } from "@/features/author/types/paper-registration";
import { HashDisplay } from "./HashDisplay";

interface ConfirmationScreenProps {
  submitted: boolean;
  txHash: string;
  txTimestamp: string;
  fileHash: string;
  datasetHash: string;
  codeCommit: string;
  envHash: string;
  contract: SignedContract | undefined;
}

export function ConfirmationScreen({
  submitted, txHash, txTimestamp, fileHash, datasetHash, codeCommit, envHash, contract,
}: ConfirmationScreenProps) {
  return (
    <div
      className="rounded-lg text-center p-10 mb-5"
      style={{
        background: submitted ? "rgba(120,180,120,0.04)" : "rgba(180,160,120,0.04)",
        border: "1px solid " + (submitted ? "rgba(120,180,120,0.2)" : "rgba(180,160,120,0.2)"),
      }}
    >
      <div className="text-[40px] mb-3">{"\u2713"}</div>
      <div className="text-xl text-[#e8e0d4] italic mb-1.5">
        {submitted ? "Paper Submitted" : "Draft Registered"}
      </div>
      <div className="text-xs text-[#8a8070] mb-6">
        {submitted
          ? "Your paper has been submitted for peer review and recorded on Hedera."
          : "Your draft has been timestamped on Hedera for proof of first disclosure."}
      </div>

      <div
        className="inline-block text-left p-5 rounded-md min-w-[360px]"
        style={{ background: "rgba(30,28,24,0.5)", border: "1px solid rgba(120,110,95,0.15)" }}
      >
        <div className="mb-3">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-0.5">Transaction Hash</div>
          <div className="text-[13px] text-[#5a7a9a] font-mono cursor-pointer">{txHash} {"\u2197"}</div>
        </div>
        <div className="mb-3">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-0.5">Timestamp</div>
          <div className="text-[13px] text-[#d4ccc0]">{txTimestamp}</div>
        </div>
        <HashDisplay label="Paper Hash" hash={fileHash} />
        <HashDisplay label="Dataset" hash={datasetHash} />
        <HashDisplay label="Code" hash={codeCommit} />
        <HashDisplay label="Environment" hash={envHash} />
        {contract && <HashDisplay label="Contract" hash={contract.hash.replace("0x", "") + "0000"} />}
      </div>

      <div className="flex gap-3 justify-center mt-6">
        <button
          className="py-2.5 px-6 rounded text-[#d4c8a8] font-serif text-[13px] cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))",
            border: "1px solid rgba(180,160,120,0.3)",
          }}
        >View Paper {"\u2192"}</button>
        <button
          className="py-2.5 px-6 rounded text-[#8a8070] font-serif text-[13px] cursor-pointer"
          style={{ background: "none", border: "1px solid rgba(120,110,95,0.2)" }}
        >Return to Dashboard</button>
      </div>
    </div>
  );
}
