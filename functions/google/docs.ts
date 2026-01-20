import { createDocsClient } from "@/lib/google-client";

export async function readDocument(documentId: string) {
  try {
    const docsClient = await createDocsClient();
    const res = await docsClient.documents.get({
      documentId,
    });
    const doc = res.data;

    const content = doc.body?.content || [];
    let fullText = "";
    for (const element of content) {
      if (element.paragraph) {
        const paragraphElements = element.paragraph.elements || [];

        for (const elem of paragraphElements) {
          if (elem.textRun?.content) {
            fullText += elem.textRun.content;
          }
        }

        if (!fullText.endsWith("\n")) {
          fullText += "\n";
        }
      }

      if (element.sectionBreak) {
        fullText += "\n---\n\n";
      }

      if (element.table) {
        const rows = element.table.tableRows || [];

        for (const row of rows) {
          const cells = row.tableCells || [];
          const cellTexts: string[] = [];

          for (const cell of cells) {
            let cellText = "";
            const cellContent = cell.content || [];

            for (const cellElement of cellContent) {
              if (cellElement.paragraph) {
                const paragraphElements = cellElement.paragraph.elements || [];
                for (const elem of paragraphElements) {
                  if (elem.textRun?.content) {
                    cellText += elem.textRun.content.replace(/\n/g, " ");
                  }
                }
              }
            }

            cellTexts.push(cellText.trim());
          }

          fullText += cellTexts.join(" | ") + "\n";
        }

        fullText += "\n";
      }
    }

    return {
      success: true,
      document: {
        title: res.data.title,
        content: fullText,
        id: res.data.documentId,
        style: res.data.documentStyle,
      },
    };
   } catch (err: any) {
     return {
       success: false,
       error: err.message || "Failed to read document",
     };
   }
}

export async function createDocument(title: string, content?: string) {
  try {
    const docsClient = await createDocsClient();

    const createDocumentWithTitle = await docsClient.documents.create({
      requestBody: {
        title,
      },
    });

    const documentId = createDocumentWithTitle.data.documentId;
    const titleSet = createDocumentWithTitle.data.title;

    if (content && documentId) {
      await docsClient.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        },
      });
    }

    return {
      success: true,
      document: {
        id: documentId,
        title: titleSet,
        url: `https://docs.google.com/document/d/${documentId}/edit`,
      },
    };
  } catch (err: any) {
    console.error("Error creating document:", err);
    return {
      success: false,
      error: err.message || "Failed to create a document",
    };
  }
}
