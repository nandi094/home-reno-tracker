// Renovation Tracker - Google Apps Script Backend
// Deploy as Web App: Execute as "Me", Who has access: "Anyone"

const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// IMPORTANT: Replace with your Google Drive Folder ID for receipt uploads
const RECEIPTS_FOLDER_ID = " https://drive.google.com/drive/folders/1BCU_2KtsfeZAzFkQXwEf1ixx7WA-UNak";

function doGet(e) {
  const action = e.parameter.action;
  const passcode = e.parameter.passcode;

  const user = authenticateUser(passcode);
  if (!user) {
    return respondJSON({ error: "Unauthorized access: Invalid passcode" }, 401);
  }

  if (action === "getReport") {
    const expenses = getSheetData("Expenses");
    const tasks = getSheetData("Tasks");

    // Contractor role gets task view only, no financial summaries
    if (user.role === "Contractor") {
      return respondJSON({ user, tasks, expenses: [] });
    }

    return respondJSON({ user, tasks, expenses });
  }

  return respondJSON({ error: "Invalid action" }, 400);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const user = authenticateUser(body.passcode);

    if (!user) {
      return respondJSON({ error: "Unauthorized" }, 401);
    }

    if (user.role === "Contractor") {
      return respondJSON({ error: "Permission denied for role: Contractor" }, 403);
    }

    if (body.action === "addExpense") {
      const sheet = SPREADSHEET.getSheetByName("Expenses");
      const id = "EXP-" + Utilities.getUuid().slice(0, 6).toUpperCase();
      let fileUrl = "";

      if (body.receiptFile && body.receiptFile.base64) {
        fileUrl = saveReceiptToDrive(
          body.receiptFile.base64,
          body.receiptFile.mimeType,
          body.receiptFile.filename || "receipt",
          id
        );
      }

      sheet.appendRow([
        id,
        body.room || "General",
        body.category || "Materials",
        body.description || "N/A",
        Number(body.estimatedCost) || 0,
        Number(body.actualCost) || 0,
        body.status || "Paid",
        body.paidDate || new Date().toISOString().split("T")[0],
        fileUrl
      ]);

      return respondJSON({ success: true, id, fileUrl });
    }

    if (body.action === "addTask") {
      const sheet = SPREADSHEET.getSheetByName("Tasks");
      const id = "TSK-" + Utilities.getUuid().slice(0, 6).toUpperCase();

      sheet.appendRow([
        id,
        body.room || "General",
        body.task || "New Task",
        body.assignedTo || "Unassigned",
        body.status || "Pending",
        body.dueDate || ""
      ]);

      return respondJSON({ success: true, id });
    }

    return respondJSON({ error: "Unsupported POST action" }, 400);

  } catch (err) {
    return respondJSON({ error: err.toString() }, 500);
  }
}

function saveReceiptToDrive(base64Data, mimeType, originalName, expenseId) {
  if (!RECEIPTS_FOLDER_ID || RECEIPTS_FOLDER_ID === " https://drive.google.com/drive/folders/1BCU_2KtsfeZAzFkQXwEf1ixx7WA-UNak") {
    throw new Error("RECEIPTS_FOLDER_ID is not configured in Apps Script.");
  }

  const folder = DriveApp.getFolderById(RECEIPTS_FOLDER_ID);
  const pureBase64 = base64Data.replace(/^data:.*;base64,/, "");
  const decodedBytes = Utilities.base64Decode(pureBase64);

  const extension = originalName.includes(".") ? originalName.split('.').pop() : "pdf";
  const standardizedName = `${expenseId}_Receipt.${extension}`;

  const blob = Utilities.newBlob(decodedBytes, mimeType, standardizedName);
  const file = folder.createFile(blob);

  // Set permissions so anyone with the link can view receipt
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

function authenticateUser(passcode) {
  if (!passcode) return null;
  const sheet = SPREADSHEET.getSheetByName("AuthorizedUsers");
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  // Expects headers in row 1: Email (col 0), Passcode (col 1), Role (col 2)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(passcode).trim()) {
      return { email: data[i][0], role: data[i][2] };
    }
  }
  return null;
}

function getSheetData(sheetName) {
  const sheet = SPREADSHEET.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx];
      if (val instanceof Date) {
        val = val.toISOString().split("T")[0];
      }
      obj[h] = val;
    });
    return obj;
  });
}

function respondJSON(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify({ status, data }))
    .setMimeType(ContentService.MimeType.JSON);
}
