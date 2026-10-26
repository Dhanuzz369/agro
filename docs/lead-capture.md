# Lead capture: quote form → Google Sheets

The quote form on `/contact` asks one thing at a time. Contact details come first and are sent the moment the
buyer taps **Next**, so even a buyer who stops halfway is a lead. Each later step updates **the same row**
(matched by `leadId`), and the final step marks it `submitted`.

The form sends JSON as `text/plain` (so the browser skips the CORS preflight that Apps Script cannot answer).
Without JavaScript the form posts as a normal HTML form; the script below handles both.

## 1. Create the sheet

1. Create a Google Sheet, e.g. **GoodBiz quote leads**.
2. **Extensions → Apps Script**, delete the sample code and paste the script below.
3. Set `NOTIFY` to the inbox that should get an email for each lead (or leave it empty for no email).

```js
const SHEET = 'Leads';
const NOTIFY = 'export@goodbizagri.com'; // '' to switch email alerts off
const COLUMNS = ['leadId', 'stage', 'firstSeen', 'updated', 'name', 'company', 'email', 'whatsapp', 'product',
  'variety', 'quantity', 'country', 'port', 'incoterm', 'message', 'locale', 'page', 'summary'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = e.postData && e.postData.type !== 'application/x-www-form-urlencoded'
      ? JSON.parse(e.postData.contents)
      : Object.assign({ leadId: Utilities.getUuid(), stage: 'submitted' }, e.parameter, // no-JS form post
        { quantity: e.parameter.quantityOther || e.parameter.quantityChoice || '' });
    if (data.botcheck) return reply({ ok: true }); // honeypot: pretend success
    const sheet = sheetWithHeader();
    const now = new Date();
    const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().map((r) => r[0]);
    const at = ids.indexOf(data.leadId);
    const row = at >= 0 ? at + 2 : sheet.getLastRow() + 1;
    const old = at >= 0 ? sheet.getRange(row, 1, 1, COLUMNS.length).getValues()[0] : [];
    const values = COLUMNS.map((c, i) => {
      if (c === 'firstSeen') return old[i] || now;
      if (c === 'updated') return now;
      const v = data[c];
      return v === undefined || v === '' ? (old[i] ?? '') : safe(v);
    });
    sheet.getRange(row, 1, 1, COLUMNS.length).setValues([values]);
    if (NOTIFY && (data.stage === 'contact' || data.stage === 'submitted')) {
      const title = data.stage === 'submitted' ? 'Quote request' : 'New lead (form started)';
      MailApp.sendEmail({ to: NOTIFY, subject: `${title}: ${data.name || ''} ${data.country ? `(${data.country})` : ''}`,
        body: `${data.summary || ''}\n\nSheet: ${SpreadsheetApp.getActive().getUrl()}`, replyTo: data.email || NOTIFY });
    }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visitors type these values: a leading = + - @ (or tab/CR) would make Sheets run them as a formula, so quote it.
function safe(v) {
  const s = String(v).slice(0, 2000);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function sheetWithHeader() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS).setFrozenRows(1);
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

## 2. Publish it

1. **Deploy → New deployment → Web app**.
2. *Execute as*: **Me**. *Who has access*: **Anyone**.
3. Authorise when asked, then copy the **Web app URL** (ends in `/exec`).
4. Put it in `src/content/site.yaml` → `leadEndpoint`, commit and push.

After editing the script later, use **Deploy → Manage deployments → Edit → New version** so the same URL keeps working.

## 3. Test

Open `/contact`, fill in the first step and tap **Next**: a row with stage `contact` appears. Finish the form: the
same row moves to `submitted`. If the endpoint is missing or down, the buyer sees a WhatsApp/email button with
their request already written out, so the lead is never lost.
