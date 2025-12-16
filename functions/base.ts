import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getGoogleAccessToken() {
  
return await auth.api.getAccessToken({
body : {
  providerId : "google",
},
headers : await headers()
}).then((r) => r.accessToken)
  
}
