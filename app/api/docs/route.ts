import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // const { title, content } = await req.json();


    const docTitle = "AI Agent Test Document";
    const docContent =
      "This document was created by an AI agent using the Google Docs API!\n\nPretty cool, right?";

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

    const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: docTitle,
      }),
    });

    const createData = await createRes.json();

    if (createData.error) {
      return NextResponse.json(
        { error: createData.error },
        { status: createRes.status }
      );
    }

    const documentId = createData.documentId;

    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: {
                  index: 1,
                },
                text: docContent,
              },
            },
          ],
        }),
      }
    );

    const updateData = await updateRes.json();

    if (updateData.error) {
      return NextResponse.json(
        { error: updateData.error },
        { status: updateRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      documentId: documentId,
      title: docTitle,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
