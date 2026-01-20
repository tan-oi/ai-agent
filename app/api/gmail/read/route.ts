import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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

    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?q='tests'",
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
        },
      }
    );

    const listData = await listRes.json();

    if (!listData.messages) {
      return NextResponse.json({
        success: true,
        emails: [],
      });
    }

    const emailPromises = listData.messages.map(async (msg: any) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        }
      );
      return msgRes.json();
    });

    const emails = await Promise.all(emailPromises);

    const parsedEmails = emails.map((email) => {
      const headers = email.payload?.headers || [];
      const subject =
        headers.find((h: any) => h.name === "Subject")?.value || "No Subject";
      const from =
        headers.find((h: any) => h.name === "From")?.value || "Unknown";
      const date = headers.find((h: any) => h.name === "Date")?.value || "";

      return {
        id: email.id,
        threadId: email.threadId,
        subject,
        from,
        date,
        snippet: email.snippet,
      };
    });

    return NextResponse.json({
      success: true,
      emails: parsedEmails,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
