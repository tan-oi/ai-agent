import { createGmailClient } from "@/lib/google-client";

interface EmailResult {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body?: string;
}

export async function readEmailFunction(query: string, maxResults = 10) {
  try {
    const gmail = await createGmailClient();

    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    if (!listRes.data.messages || listRes.data.messages.length === 0) {
      return {
        success: true,
        emails: [],
        message: "No emails found matching the query",
      };
    }

    const emailPromises = listRes.data.messages.map(async (msg) => {
      const emailRes = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });
      return emailRes.data;
    });

    const emails = await Promise.all(emailPromises);

    const parsedEmails: EmailResult[] = emails.map((email) => {
      const headers = email.payload?.headers || [];

      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
          ?.value || "";

      let body = "";
      if (email.payload?.body?.data) {
        body = Buffer.from(email.payload.body.data, "base64").toString("utf-8");
      } else if (email.payload?.parts) {
        const textPart = email.payload.parts.find(
          (part) =>
            part.mimeType === "text/plain" || part.mimeType === "text/html"
        );
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        }
      }

      return {
        id: email.id!,
        threadId: email.threadId!,
        subject: getHeader("Subject") || "No Subject",
        from: getHeader("From") || "Unknown",
        date: getHeader("Date"),
        snippet: email.snippet || "",
      };
    });

    return {
      success: true,
      count: parsedEmails.length,
      emails: parsedEmails,
    };
  } catch (error: any) {
    console.error("Gmail API error:", error);
    return {
      success: false,
      error: error.message || "Failed to read emails",
    };
  }
}

export async function getEmailById(messageId: string) {
  try {
    const gmail = await createGmailClient();

    const res = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers = res.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value || "";

    return {
      success: true,
      email: {
        id: res.data.id!,
        threadId: res.data.threadId!,
        subject: getHeader("Subject") || "No Subject",
        from: getHeader("From"),
        to: getHeader("To"),
        date: getHeader("Date"),
        snippet: res.data.snippet || "",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendEmailFunction(
  to: string,
  subject: string,
  body: string,
  isHtml = false
) {
  try {
    const gmail = await createGmailClient();

    const contentType = isHtml ? "text/html" : "text/plain";

    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: ${contentType}; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      ``,
      body,
    ].join("\r\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    return {
      success: true,
      messageId: res.data.id,
      threadId: res.data.threadId,
      sentTo: to,
      subject,
      message: "Email sent successfully",
    };
  } catch (error: any) {
    console.error("Gmail send error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

export async function sendEmailAdvanced({
  to,
  subject,
  body,
  cc,
  bcc,
  isHtml = false,
}: {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  isHtml?: boolean;
}) {
  try {
    const gmail = await createGmailClient();

    const toList = Array.isArray(to) ? to.join(", ") : to;
    const ccList = cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : "";
    const bccList = bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : "";

    const contentType = isHtml ? "text/html" : "text/plain";

    const emailLines = [
      `To: ${toList}`,
      ccList && `Cc: ${ccList}`,
      bccList && `Bcc: ${bccList}`,
      `Subject: ${subject}`,
      `Content-Type: ${contentType}; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      ``,
      body,
    ].filter(Boolean);

    const email = emailLines.join("\r\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    return {
      success: true,
      messageId: res.data.id,
      threadId: res.data.threadId,
      sentTo: toList,
      subject,
      message: "Email sent successfully",
    };
  } catch (error: any) {
    console.error("Gmail send error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

export async function replyToEmail(
  messageId: string,
  threadId: string,
  body: string,
  isHtml = false
) {
  try {
    const gmail = await createGmailClient();

    const original = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
    });

    const headers = original.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value || "";

    const originalFrom = getHeader("From");
    const originalSubject = getHeader("Subject");
    const subject = originalSubject.startsWith("Re:")
      ? originalSubject
      : `Re: ${originalSubject}`;

    const contentType = isHtml ? "text/html" : "text/plain";

    const email = [
      `To: ${originalFrom}`,
      `Subject: ${subject}`,
      `Content-Type: ${contentType}; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `In-Reply-To: ${messageId}`,
      `References: ${messageId}`,
      ``,
      body,
    ].join("\r\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
        threadId,
      },
    });

    return {
      success: true,
      messageId: res.data.id,
      threadId: res.data.threadId,
      message: "Reply sent successfully",
    };
  } catch (error: any) {
    console.error("Gmail reply error:", error);
    return {
      success: false,
      error: error.message || "Failed to send reply",
    };
  }
}
