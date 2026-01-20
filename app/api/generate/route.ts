import { z } from "zod";
import {
  Experimental_Agent as Agent,
  convertToModelMessages,
  stepCountIs,
  tool,
} from "ai";
import { readEmailFunction, sendEmailFunction } from "@/functions/google/gmail";
import { NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createDocument, readDocument } from "@/functions/google/docs";
import { streamText } from "ai";
import { findFreeSlots } from "@/functions/google/calender";
import { createSpreadSheet, readSheet } from "@/functions/google/sheets";

export async function POST(req: Request) {
  try {
    const userAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!userAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    const result = streamText({
      model: groq("openai/gpt-oss-120b"),
      messages: convertToModelMessages(messages),
      tools: {
        readEmail: {
          description:
            "Search and retrieve emails from Gmail. Use Gmail query syntax: 'is:unread' for unread emails, 'from:user@example.com' to filter by sender, 'subject:keyword' for subject search, 'after:2024/01/01' for date filters.",
          inputSchema: z.object({
            query: z
              .string()
              .describe(
                "Gmail search query like 'is:unread from:boss@company.com'"
              ),
          }),
          execute: async ({ query }) => {
            console.log(`Executing readEmail with query: ${query}`);
            const emailList = await readEmailFunction(query);
            return emailList;
          },
        },

        sendEmail: {
          description:
            "Send an email via Gmail. Extract recipient, subject, and body from user's request.",
          inputSchema: z.object({
            to: z.string().describe("Recipient email address"),
            emailSubject: z.string().describe("Email subject line"),
            emailBody: z.string().describe("Full email body content"),
          }),
          execute: async ({ to, emailSubject, emailBody }) => {
            console.log(`Sending email to: ${to}`);
            const result = await sendEmailFunction(to, emailSubject, emailBody);
            return result;
          },
        },

        readDocs: {
          description: "Read content from a Google Docs document.",
          inputSchema: z.object({
            documentId: z.string().describe("Google Docs document ID"),
          }),
          execute: async ({ documentId }) => {
            const result = await readDocument(documentId);
            return result;
          },
        },

        createDocs: {
          description: "Create a new Google Docs document.",
          inputSchema: z.object({
            title: z.string().describe("Document title"),
            content: z.string().describe("Initial document content").optional(),
          }),
          execute: async ({ title, content }) => {
            const result = await createDocument(title, content);
            return result;
          },
        },

        checkCalenderFreeSlot: {
          description: "Used to find free slots in calender",
          inputSchema: z.object({
            startTime: z.date().describe("look up start time"),
            endTime: z.date().describe("Until which date"),
            durationMinutes: z.number().describe("Duration of slot"),
          }),
          execute: async ({ startTime, endTime, durationMinutes }) => {
            return await findFreeSlots(startTime, endTime, durationMinutes);
          },
        },

        readSheet: {
          description:
            "Read data from a Google Sheets spreadsheet. Returns cell values as a 2D array. You can read an entire sheet or specify a specific range of cells",
          inputSchema: z.object({
            spreadsheetId: z
              .string()
              .describe(
                "The ID of the spreadsheet (found in the URL: docs.google.com/spreadsheets/d/{spreadsheetId})"
              ),
            range: z
              .string()
              .optional()
              .describe(
                'Optional. The range to read in A1 notation. Examples: "Sheet1" (entire sheet), "Sheet2!A1:D10" (specific cells in Sheet2), "Budget!A:C" (columns A-C in Budget sheet). If omitted, reads all data from the first sheet.'
              ),
          }),
          execute: async ({ spreadsheetId, range }) => {
            return await readSheet(spreadsheetId, range);
          },
        },

        createSheet: {
          description:
            "Create a new Google Sheets spreadsheet. Returns the spreadsheet ID and URL.",
          inputSchema: z.object({
            title: z.string().describe("The name/title of the new spreadsheet"),
            sheetNames: z
              .array(z.string())
              .optional()
              .describe(
                'Optional. Names for the initial sheets/tabs. If not provided, creates a default "Sheet1".'
              ),
          }),
          execute: async ({ title, sheetNames }) => {
            return await createSpreadSheet(title, sheetNames);
          },
        },
      },
      system: `You are a Google Workspace automation agent. Your job is to COMPLETE tasks using the available tools.

CRITICAL RULES:
1. ALWAYS use tools to perform actions - never just describe what you would do
2. When asked to check/read emails → use readEmail immediately
3. When asked to send email → use sendEmail immediately  
4. After using a tool, confirm what you did with specific details
5. If info is missing, ask ONCE, then execute when provided
6. Make reasonable assumptions rather than overthinking

Be concise and action-oriented. Execute tasks, don't just talk about them.`,
      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Stream error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
