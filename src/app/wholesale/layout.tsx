import { WholesaleAuthProvider } from "./contexts/auth-context";
import type { ReactNode } from "react";

export default function WholesaleLayout({ children }: { children: ReactNode }) {
  return (
    <WholesaleAuthProvider>
      {children}
    </WholesaleAuthProvider>
  );
}
