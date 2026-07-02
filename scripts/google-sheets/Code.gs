/**
 * Verlin Labs — Google Sheets Integration
 *
 * SETUP (one-time in your Google Workspace):
 * 1. Go to https://script.google.com → New project
 * 2. Paste this entire file → Save
 * 3. Run `setupSpreadsheet` from the Run menu (authorize when prompted)
 * 4. Copy the Spreadsheet ID from the log (or open the new sheet from Drive)
 * 5. Project Settings → Script properties → Add:
 *      SPREADSHEET_ID = <your sheet id>
 *      WEBHOOK_SECRET = <pick a long random string>
 * 6. Deploy → New deployment → Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 7. Copy the Web App URL → add to your .env.local as GOOGLE_SHEETS_WEBHOOK_URL
 *    and WEBHOOK_SECRET as GOOGLE_SHEETS_WEBHOOK_SECRET
 *
 * GOOGLE FORM (optional native form):
 * Create a Form in Google Forms → Responses tab → Link to Sheets →
 * select this spreadsheet. Form responses will auto-sync to a new tab.
 * Your website forms use the three tabs below via this web app.
 */

const TAB_BOOKINGS = "Free Session Bookings";
const TAB_CONTACT = "Contact Inquiries";
const TAB_NEWSLETTER = "Newsletter Signups";

const HEADERS = {};
HEADERS[TAB_BOOKINGS] = [
  "Timestamp",
  "Name",
  "Email",
  "Audience",
  "Date",
  "Time",
  "Booking ID",
];
HEADERS[TAB_CONTACT] = ["Timestamp", "Name", "Email", "Message"];
HEADERS[TAB_NEWSLETTER] = ["Timestamp", "Email"];

/** Run once — creates spreadsheet with 3 tabs and headers */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.create("Verlin Labs Submissions");
  const defaultSheet = ss.getSheets()[0];

  const tabNames = [TAB_BOOKINGS, TAB_CONTACT, TAB_NEWSLETTER];
  tabNames.forEach(function (name, i) {
    const sheet = i === 0 ? defaultSheet : ss.insertSheet(name);
    sheet.setName(name);
    sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
    sheet.getRange(1, 1, 1, HEADERS[name].length)
      .setFontWeight("bold")
      .setBackground("#0A3D3A")
      .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  });

  Logger.log("Spreadsheet created: " + ss.getUrl());
  Logger.log("Spreadsheet ID: " + ss.getId());
  Logger.log("Add SPREADSHEET_ID to Script Properties: " + ss.getId());
}

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty("WEBHOOK_SECRET");
    const spreadsheetId = props.getProperty("SPREADSHEET_ID");

    if (!spreadsheetId) {
      return jsonResponse({ success: false, error: "SPREADSHEET_ID not configured" });
    }

    const body = JSON.parse(e.postData.contents);

    if (secret && body.secret !== secret) {
      return jsonResponse({ success: false, error: "Unauthorized" });
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const timestamp = new Date().toISOString();
    let sheet;
    let row;

    switch (body.type) {
      case "booking":
        sheet = getOrCreateTab(ss, TAB_BOOKINGS);
        row = [
          timestamp,
          body.name || "",
          body.email || "",
          body.audience || "",
          body.date || "",
          body.time || "",
          body.bookingId || "",
        ];
        break;
      case "contact":
        sheet = getOrCreateTab(ss, TAB_CONTACT);
        row = [timestamp, body.name || "", body.email || "", body.message || ""];
        break;
      case "newsletter":
        sheet = getOrCreateTab(ss, TAB_NEWSLETTER);
        row = [timestamp, body.email || ""];
        break;
      default:
        return jsonResponse({ success: false, error: "Unknown type: " + body.type });
    }

    sheet.appendRow(row);
    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse({ status: "ok", message: "Verlin Labs Sheets webhook is running" });
}

function getOrCreateTab(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (HEADERS[name]) {
      sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}