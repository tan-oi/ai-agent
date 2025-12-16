import { z } from "zod";
import { Experimental_Agent as Agent, stepCountIs, tool } from "ai";
import { readEmailFunction, sendEmailFunction } from "@/functions/google/gmail";
import { NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createDocument, readDocument } from "@/functions/google/docs";

export async function POST(req: Request) {
  try {
    const userAuth = await auth.api.getSession({
      headers: await headers(),
    });
    console.log(userAuth, "auth");


    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const googleSuiteAgent = new Agent({
      model: groq("openai/gpt-oss-120b"),
      stopWhen: stepCountIs(10),
      tools: {
        readEmail: tool({
          description:
            "Get the emails based on user demands. Supports Gmail search queries like 'is:unread', 'from:email@example.com', 'subject:keyword'",
          inputSchema: z.object({
            query: z
              .string()
              .describe("The Gmail search query to filter emails"),
          }),
          execute: async ({ query }) => {
            const emailList = await readEmailFunction(query);
            return emailList;
          },
        }),

        sendEmail: tool({
          description: "Send email on behalf of user via Gmail",
          inputSchema: z.object({
            to: z.string().describe("The recipient email address"),
            emailSubject: z.string().describe("The subject of the email"),
            emailBody: z.string().describe("The body content of the email"),
          }),
          execute: async ({ to, emailSubject, emailBody }) => {
            const result = await sendEmailFunction(to, emailSubject, emailBody);
            return result;
          },
        }),

        readDocs: tool({
          description: "Read a google document or commonly called google docs",
          inputSchema: z.object({
            documentId: z
              .string()
              .describe("The id of the document to be read"),
          }),
          execute: async ({ documentId }) => {
            const result = await readDocument(documentId);
            return result;
          },
        }),

        createDocs: tool({
          description: "Create a document via google docs",
          inputSchema: z.object({
            title: z.string().describe("The title of the document"),
            content: z
              .string()
              .describe("The content to be written inside")
              .optional(),
          }),
          execute: async ({ title, content }) => {
            const result = await createDocument(title, content);
            return result;
          },
        }),
      },
      system: `You are a helpful Google assistant. You can:
- Read and search emails using Gmail search syntax
- Send emails on behalf of the user
- Provide summaries and insights from emails
- Read google docs document given a valid id

Always be clear about what actions you're taking and only confirm before sending emails if ambigious, if the user mentions dont ask or re-confirm just do the job and help the user with a summary of what you did.`,
    });

    const result = await googleSuiteAgent.generate({
      prompt: message,
    });

    
    console.log("Agent result:", JSON.stringify(result, null, 2));

    const responseText = result.text;

    return NextResponse.json({
      success: true,
      response: responseText,
      steps: result.steps?.length || 0,
      debug: {
        hasText: !!result.text,
        hasResponse: !!result.response,
        // hasMessages: !!result.messages,
        toolResults: result.toolResults,
      },
    });
  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
