import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
console.log(clientId);

if (!clientId && typeof window !== "undefined") {
  console.warn("NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set — wallet features will not work");
}

export const client = createThirdwebClient({
  clientId: clientId ?? "placeholder",
});
