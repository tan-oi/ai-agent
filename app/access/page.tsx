"use client";

import { authClient } from "@/lib/auth-client";

export default function Access() {
  const getAccess = async () => {
    const auth = await authClient.signIn.social({
      provider : "google"
    })
  };
  return (
    <>
      <button onClick={() => getAccess()}>read</button>
    </>
  );
}
