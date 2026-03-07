"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { UserProvider } from "@/src/shared/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <UserProvider>{children}</UserProvider>
    </ThirdwebProvider>
  );
}
