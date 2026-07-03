/**
 * Verlin Labs — Google Sheets Integration
 *
 * SETUP (one-time in your Google Workspace):
 * 1. Go to https://script.google.com → New project
 * 2. Paste this entire file → Save
 * 3. Run `setupSpreadsheet` from the Run menu (authorize when prompted)
 *    — OR run `migrateSpreadsheet` if you already have a sheet
 * 4. Copy the Spreadsheet ID from the log (or open the sheet from Drive)
 * 5. Project Settings → Script properties → Add:
 *      SPREADSHEET_ID = <your sheet id>
 *      WEBHOOK_SECRET = <pick a long random string>
 * 6. Deploy → New deployment → Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 7. Copy the Web App URL → add to .env.local and Vercel:
 *      GOOGLE_SHEETS_WEBHOOK_URL
 *      GOOGLE_SHEETS_WEBHOOK_SECRET
 * 8. From the project root run: npm run sync:session-sheet
 *    — OR run `refreshSessionDetailsTab` once in Apps Script
 */

const TAB_BOOKINGS = "Free Session";
const TAB_SESSION_DETAILS = "Free Session Details";
const TAB_CONTACT = "Contact Us";
const TAB_NEWSLETTER = "Newsletter Subscribers";

const HEADERS = {};
HEADERS[TAB_BOOKINGS] = [
  "Timestamp",
  "Booking ID",
  "Status",
  "Name",
  "Email",
  "Audience",
  "Audience Label",
  "Session Title",
  "Session Duration",
  "Date",
  "Time",
  "Timezone",
  "Source",
];
HEADERS[TAB_CONTACT] = ["Timestamp", "Name", "Email", "Message", "Source"];
HEADERS[TAB_NEWSLETTER] = ["Timestamp", "Email", "Source"];

/** Run once — creates spreadsheet with 4 tabs and headers */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.create("Verlin Labs Submissions");
  const defaultSheet = ss.getSheets()[0];

  const tabNames = [TAB_BOOKINGS, TAB_SESSION_DETAILS, TAB_CONTACT, TAB_NEWSLETTER];
  tabNames.forEach(function (name, i) {
    const sheet = i === 0 ? defaultSheet : ss.insertSheet(name);
    sheet.setName(name);
    styleHeaderRow_(sheet, HEADERS[name]);
    sheet.setFrozenRows(1);
  });

  writeSessionDetails_(ss, getDefaultSessionDetails_());

  Logger.log("Spreadsheet created: " + ss.getUrl());
  Logger.log("Spreadsheet ID: " + ss.getId());
  Logger.log("Add SPREADSHEET_ID to Script Properties: " + ss.getId());
}

/** Run on an existing sheet — adds columns, session tab, and refreshes details */
function migrateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) {
    throw new Error("Set SPREADSHEET_ID in Script Properties first");
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  const bookings = getOrCreateTab(ss, TAB_BOOKINGS);
  ensureHeaders_(bookings, HEADERS[TAB_BOOKINGS]);
  getOrCreateTab(ss, TAB_SESSION_DETAILS);
  writeSessionDetails_(ss, getDefaultSessionDetails_());

  Logger.log("Migration complete: " + ss.getUrl());
}

/** Run manually to refresh session reference content without redeploying */
function refreshSessionDetailsTab() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) {
    throw new Error("Set SPREADSHEET_ID in Script Properties first");
  }
  const ss = SpreadsheetApp.openById(spreadsheetId);
  writeSessionDetails_(ss, getDefaultSessionDetails_());
  Logger.log("Free session details tab updated.");
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
        ensureHeaders_(sheet, HEADERS[TAB_BOOKINGS]);
        row = [
          timestamp,
          body.bookingId || "",
          body.status || "Confirmed",
          body.name || "",
          body.email || "",
          body.audience || "",
          body.audienceLabel || body.audience || "",
          body.sessionTitle || "Free 2-Hour Introductory Session",
          body.sessionDuration || "2 hours",
          body.date || "",
          body.time || "",
          body.timezone || "",
          body.source || "Website",
        ];
        sheet.appendRow(row);
        return jsonResponse({ success: true });

      case "session_details":
        writeSessionDetails_(ss, body);
        return jsonResponse({ success: true });

      case "contact":
        sheet = getOrCreateTab(ss, TAB_CONTACT);
        row = [
          timestamp,
          body.name || "",
          body.email || "",
          body.message || "",
          body.source || "Website",
        ];
        sheet.appendRow(row);
        return jsonResponse({ success: true });

      case "newsletter":
        sheet = getOrCreateTab(ss, TAB_NEWSLETTER);
        row = [timestamp, body.email || "", body.source || "Website"];
        sheet.appendRow(row);
        return jsonResponse({ success: true });

      default:
        return jsonResponse({ success: false, error: "Unknown type: " + body.type });
    }
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
      styleHeaderRow_(sheet, HEADERS[name]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  const width = headers.length;
  const current = sheet.getLastColumn();
  const existing =
    current > 0
      ? sheet.getRange(1, 1, 1, Math.max(current, width)).getValues()[0]
      : [];

  if (existing.length >= width && headers.every(function (h, i) { return existing[i] === h; })) {
    return;
  }

  styleHeaderRow_(sheet, headers);
  sheet.setFrozenRows(1);
}

function styleHeaderRow_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#0A3D3A")
    .setFontColor("#FFFFFF");
}

function writeSessionDetails_(ss, details) {
  const sheet = getOrCreateTab(ss, TAB_SESSION_DETAILS);
  sheet.clear();

  let row = 1;
  sheet.getRange(row, 1).setValue("Free Session — Reference").setFontWeight("bold").setFontSize(14);
  row += 2;

  sheet.getRange(row, 1).setValue("Headline").setFontWeight("bold");
  sheet.getRange(row, 2).setValue(details.headline || "");
  row++;

  sheet.getRange(row, 1).setValue("Description").setFontWeight("bold");
  sheet.getRange(row, 2).setValue(details.description || "").setWrap(true);
  row += 2;

  sheet.getRange(row, 1, 1, 2).setValues([["Benefits", ""]]).setFontWeight("bold").setBackground("#E8F5F3");
  row++;
  sheet.getRange(row, 1, 1, 2).setValues([["Title", "Description"]]).setFontWeight("bold");
  row++;

  (details.benefits || []).forEach(function (b) {
    sheet.getRange(row, 1).setValue(b.title || "");
    sheet.getRange(row, 2).setValue(b.description || "").setWrap(true);
    row++;
  });
  row++;

  sheet.getRange(row, 1, 1, 4).setValues([["Agenda", "", "", ""]]).setFontWeight("bold").setBackground("#E8F5F3");
  row++;
  sheet.getRange(row, 1, 1, 4).setValues([["Time", "Duration", "Title", "Description"]]).setFontWeight("bold");
  row++;

  (details.agenda || []).forEach(function (item) {
    sheet.getRange(row, 1, 1, 4).setValues([[
      item.time || "",
      item.duration || "",
      item.title || "",
      item.description || "",
    ]]);
    sheet.getRange(row, 4).setWrap(true);
    row++;
  });
  row++;

  sheet.getRange(row, 1, 1, 3).setValues([["FAQ", "", ""]]).setFontWeight("bold").setBackground("#E8F5F3");
  row++;
  sheet.getRange(row, 1, 1, 3).setValues([["Category", "Question", "Answer"]]).setFontWeight("bold");
  row++;

  (details.faqCategories || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      const answer = [item.answer || ""]
        .concat(item.bullets || [])
        .join("\n\n");
      sheet.getRange(row, 1).setValue(cat.title || "");
      sheet.getRange(row, 2).setValue(item.question || "");
      sheet.getRange(row, 3).setValue(answer).setWrap(true);
      row++;
    });
  });

  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 420);
  sheet.setColumnWidth(4, 320);
}

/** Default content — keep in sync with content/free-session.json */
function getDefaultSessionDetails_() {
  return {
    headline: "Book Your Free 2-Hour Introductory Session",
    description:
      "Experience how Verlin Labs teaches — through clarity, mental models, and deep understanding. No sales pitch. Just a focused session that shows you what's possible.",
    benefits: [
      { title: "Core mental model framework", description: "Learn our clarity-first approach to breaking down any complex topic." },
      { title: "Live AI concept walkthrough", description: "See how we explain AI fundamentals without jargon or hand-waving." },
      { title: "Personalized learning path", description: "Get recommendations tailored to your audience and goals." },
      { title: "Interactive Q&A", description: "Ask anything — we prioritize understanding over covering slides." },
      { title: "Resource starter pack", description: "Leave with curated materials to continue learning on your own." },
      { title: "Zero commitment", description: "The session is genuinely free. Explore the full course only if it resonates." },
    ],
    agenda: [
      { time: "0:00", duration: "15 min", title: "Welcome & context setting", description: "Understand your goals and what clarity-first learning means." },
      { time: "0:15", duration: "30 min", title: "Mental models primer", description: "A live demonstration of how we map complex ideas to understandable frameworks." },
      { time: "0:45", duration: "30 min", title: "AI deep-dive (audience-tailored)", description: "Walk through a core AI concept adapted to your background and level." },
      { time: "1:15", duration: "30 min", title: "Hands-on exercise", description: "Apply the framework to a real problem — together." },
      { time: "1:45", duration: "15 min", title: "Your learning path & Q&A", description: "Personalized next steps and open discussion." },
    ],
    faqCategories: [
      {
        title: "About the session",
        items: [
          {
            question: "Is the introductory session really free?",
            answer: "Yes — the full 2-hour introductory session is completely free. There is no enrollment fee, no credit card required to book, and no hidden charges during or after the session.",
            bullets: [
              "No payment information is collected when you book",
              "You are never auto-enrolled in a paid program",
              "Enrollment in the full track is optional and only discussed if it fits your goals",
            ],
          },
          {
            question: "Who is this session designed for?",
            answer: "The session is designed for learners at different stages who want to understand AI and technology with clarity — not hype.",
            bullets: [
              "School students (Classes 6–12)",
              "College engineers",
              "Working professionals & product managers",
            ],
          },
          {
            question: "How long is the session?",
            answer: "The session is scheduled for 2 hours in total with a published agenda and timed segments.",
            bullets: [
              "0:00–0:15 — Welcome and goal alignment",
              "0:15–0:45 — Mental models primer",
              "0:45–1:15 — Audience-tailored AI deep-dive",
              "1:15–1:45 — Guided hands-on exercise",
              "1:45–2:00 — Personalized learning path and open Q&A",
            ],
          },
        ],
      },
      {
        title: "Before you book",
        items: [
          {
            question: "What should I prepare beforehand?",
            answer: "Very little preparation is required — most attendees spend fewer than 10 minutes getting ready.",
            bullets: [
              "Laptop or tablet with stable internet",
              "One question you would like clarity on",
              "No pre-reading or paid tools required",
            ],
          },
          {
            question: "Do I need a technical or AI background?",
            answer: "No prior AI or programming background is required. The session is clarity-first and adapts by audience track.",
          },
        ],
      },
      {
        title: "Booking & next steps",
        items: [
          {
            question: "Can I reschedule or cancel?",
            answer: "Yes — reschedule or cancel from the link in your confirmation email with 24 hours' notice when possible.",
          },
          {
            question: "What happens after the session ends?",
            answer: "You receive a follow-up email within 1–2 business days with a summary, frameworks used, and suggested next steps.",
          },
          {
            question: "Will I receive resources afterward?",
            answer: "Yes — every attendee receives a curated starter pack for their audience track.",
          },
        ],
      },
    ],
  };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}