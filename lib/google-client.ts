import { getGoogleAccessToken } from "@/functions/base";
import { google } from "googleapis";

export async function getGoogleAuth() {
  const accessToken = await getGoogleAccessToken();

  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({
    access_token: accessToken,
  });

  return authClient;
}

export async function createGmailClient() {
  const auth = await getGoogleAuth();
  return google.gmail({
    version: "v1",
    auth,
  });
}

export async function createDocsClient() {
  const auth = await getGoogleAuth();
  return google.docs({
    version: "v1",
    auth,
  });
}

export async function createCalenderClient() {
  const auth = await getGoogleAuth();
  return google.calendar({
    version: "v3",
    auth,
  });
}

export async function createMeetClient() {
  const auth = await getGoogleAuth();
  return google.meet({
    version: "v2",
    auth,
  });
}

export async function createSheetsClient() {
  const auth = await getGoogleAuth();
  return google.sheets({
    version: "v4",
    auth,
  });
}
