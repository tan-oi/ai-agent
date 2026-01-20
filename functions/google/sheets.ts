import { createSheetsClient } from "@/lib/google-client";

export async function readSheet(spreadsheetId: string, range?: string) {
  try {
    const sheetsClient = await createSheetsClient();

    if (!range) {
      const metadata = await sheetsClient.spreadsheets.get({
        spreadsheetId,
      });

      const firstSheet = metadata.data.sheets?.[0]?.properties?.title;
      if (!firstSheet) {
        return {
          success: false,
          error: "No sheets found in spreadsheet",
        };
      }

      range = firstSheet;
    }

    // Get the actual data
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return {
      success: true,
      data: {
        range: response.data.range,
        values: response.data.values || [],
        rowCount: response.data.values?.length || 0,
        spreadsheetId,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to read sheet",
      code: error.code,
    };
  }
}

export async function getSheetMetadata(spreadsheetId: string) {
  try {
    const sheetsClient = await createSheetsClient();

    const response = await sheetsClient.spreadsheets.get({
      spreadsheetId,
    });

    const sheets = response.data.sheets?.map((sheet) => ({
      sheetId: sheet.properties?.sheetId,
      title: sheet.properties?.title,
      index: sheet.properties?.index,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount,
    }));

    return {
      success: true,
      data: {
        spreadsheetId: response.data.spreadsheetId,
        title: response.data.properties?.title,
        locale: response.data.properties?.locale,
        url: response.data.spreadsheetUrl,
        sheets,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get sheet metadata",
      code: error.code,
    };
  }
}

export async function createSpreadSheet(title: string, sheetNames?: string[]) {
  try {
    const sheetsClient = createSheetsClient();

    const requestBody: any = {
      properties: {
        title,
      },
    };

    if (sheetNames && sheetNames.length > 0) {
      requestBody.sheets = sheetNames.map((name, index) => ({
        properties: {
          title: name,
          index,
        },
      }));
    }

    const response = await (
      await sheetsClient
    ).spreadsheets.create({
      requestBody,
    });

    return {
      success: true,
      data: {
        spreadsheetId: response.data.spreadsheetId!,
        spreadsheetUrl: response.data.spreadsheetUrl!,
        title: response.data.properties?.title,
        sheets: response.data.sheets?.map((sheet) => ({
          sheetId: sheet.properties?.sheetId,
          title: sheet.properties?.title,
        })),
      },
    };
  } catch {
    return {
      success: false,
      error: "Creation failed",
    };
  }
}

export async function appendRows(
  spreadsheetId: string,
  sheetName: string,
  values: Array<Array<string | number>>
) {
  try {
    const sheetsClient = createSheetsClient();

    const metadata = (await sheetsClient).spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    const res = (await metadata).data;
    return {
      success: true,
      data: {
        spreadsheetId: res.spreadsheetId,
        tableRange: res.tableRange,
        updates: {
          updatedRange: res.updates?.updatedRange,
          updatedRows: res.updates?.updatedRows,
          updatedCells: res.updates?.updatedCells,
          updatedColumns: res.updates?.updatedColumns,
        },
      },
    };
  } catch (err) {
    return {
      success: false,
      error: "Cant append",
    };
  }
}
