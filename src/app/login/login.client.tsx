"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/src/shared/lib/thirdweb";
import {
  getLoginPayload,
  doLogin,
  doLogout,
  isLoggedIn,
} from "@/src/shared/lib/auth/actions";
import { useUser } from "@/src/shared/context/UserContext";

export function LoginClient() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "#1a1816" }}
    >
      <div
        className="flex flex-col items-center gap-8 px-12 py-14 rounded-lg border"
        style={{
          backgroundColor: "rgba(45,42,38,0.6)",
          borderColor: "rgba(120,110,95,0.2)",
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-serif text-4xl italic text-[#c9b89e] tracking-[3px]">
            Axiom
          </span>
          <p className="text-sm text-[#8a8070] tracking-wide">
            Blockchain-backed academic publishing
          </p>
        </div>

        <div
          className="w-full border-t"
          style={{ borderColor: "rgba(120,110,95,0.15)" }}
        />

        <div className="flex flex-col items-center gap-3">
          <p className="text-[#b0a898] text-sm font-serif">
            Connect your wallet to continue
          </p>
          <ConnectButton
            client={client}
            auth={{ isLoggedIn, getLoginPayload, doLogin, doLogout }}
            theme="dark"
            connectButton={{
              label: "Connect Wallet",
              style: {
                backgroundColor: "rgba(201, 164, 74, 0.15)",
                color: "#c9a44a",
                border: "1px solid rgba(201, 164, 74, 0.3)",
                borderRadius: "6px",
                fontSize: "13px",
                fontFamily: "Georgia, serif",
                padding: "8px 24px",
                height: "38px",
              },
            }}
          />
        </div>

        <p className="text-[11px] text-[#6a6050] text-center max-w-[260px]">
          New to Axiom? You&apos;ll be guided through setup after connecting.
        </p>
      </div>
    </div>
  );
}
