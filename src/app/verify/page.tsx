import { VerifyClient } from "@/src/features/verify/components/VerifyClient";

export default function VerifyPage() {
  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{ backgroundColor: "#1a1816" }}
    >
      <div className="max-w-[640px] mx-auto mb-10 text-center">
        <h1 className="text-[28px] font-normal text-[#e8e0d4] tracking-[0.5px] font-serif mb-2">
          Verify Paper
        </h1>
        <p className="text-[13px] text-[#6a6050] italic font-serif">
          Upload a paper to verify its on-chain registration. Your file is hashed
          locally and never uploaded.
        </p>
      </div>
      <VerifyClient />
      <div className="max-w-[640px] mx-auto mt-8 text-center">
        <a
          href="/login"
          className="text-[12px] text-[#6a6050] hover:text-[#c9a44a] font-serif transition-colors"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}
