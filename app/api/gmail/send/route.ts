import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // const { to, subject, body } = await req.json();

    // Hardcoded defaults for testing
    const emailTo = "savagegamers752@gmail.com";
    const emailSubject = "Test Email from AI Agent";
    const emailBody =
      "This is a test email sent via Gmail API. If you're seeing this, it works!";

    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "google",
      },
    });

    if (!account?.accessToken) {
      return NextResponse.json(
        { error: "No Google access token" },
        { status: 401 }
      );
    }

    const email = [
      `To: ${emailTo}`,
      `Subject: ${emailSubject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      emailBody,
    ].join("\r\n");

    // Base64url encode the email
    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send via Gmail API
    const sendRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      }
    );

    const sendData = await sendRes.json();

    if (sendData.error) {
      return NextResponse.json(
        { error: sendData.error },
        { status: sendRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: sendData.id,
      threadId: sendData.threadId,
      sentTo: emailTo,
      subject: emailSubject,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
