/**
 * page.tsx
 * Next.js page (app router server component) that fetches a Google Sheet and formats it to JSON.
 *
 * Usage:
 * 1. Copy this file into your Next.js app (app/page.tsx or app/ssd-explore/page.tsx).
 * 2. Create a .env.local in project root with:
 *    SHEET_ID=1B27_j9NDPU3cNlj2HKcrfpJKHkOf-Oi1DbuuQva2gT4
 *    SHEET_GID=0
 *    (If you prefer, set different values.)
 * 3. Run `pnpm dev`.
 *
 * Notes:
 * - This uses the public "gviz/tq?tqx=out:json" endpoint which works when the sheet is viewable publicly
 *   (anyone with link). If your sheet is private, see the bottom of this file for the Google Sheets API
 *   server-side approach and steps.
 */

import React from "react";

const DEFAULT_SHEET_ID = process.env.SHEET_ID || "1B27_j9NDPU3cNlj2HKcrfpJKHkOf-Oi1DbuuQva2gT4";
const DEFAULT_GID = process.env.SHEET_GID || "0";

async function fetchSheetAsJson(sheetId = DEFAULT_SHEET_ID, gid = DEFAULT_GID) {
  // Use the gviz JSON endpoint and parse the wrapped response
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&tqx=out:json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();

  // The response is like: "/*O_o*/\ngoogle.visualization.Query.setResponse({...});"
  const jsonStr = text.replace(/^.*setResponse\(/s, "").replace(/\);\s*$/s, "");
  const parsed = JSON.parse(jsonStr);

  const cols = parsed.table.cols.map((c: any) => (c.label || c.id || c.label || "col").toString());
  const rows = parsed.table.rows || [];

  const data = rows.map((r: any) => {
    const obj: Record<string, any> = {};
    r.c.forEach((cell: any, idx: number) => {
      const key = cols[idx] || `col_${idx}`;
      // cell may be null or have .v (value) and .f (formatted)
      obj[key] = cell === null ? null : cell.v;
    });
    return obj;
  });

  return data;
}

export default async function Page() {
  let data: any[] = [];
  let error: string | null = null;

  try {
    data = await fetchSheetAsJson();
  } catch (err: any) {
    error = err.message || String(err);
  }

  return (
    <main style={{ padding: 24, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto" }}>
      <h1>Sheet → JSON (ssd-explore)</h1>
      <p>Sheet ID: <code>{DEFAULT_SHEET_ID}</code> &middot; GID: <code>{DEFAULT_GID}</code></p>

      {error ? (
        <div style={{ color: "crimson" }}>
          <h3>Error</h3>
          <pre>{error}</pre>
        </div>
      ) : (
        <section>
          <h3>Preview (first 20 rows)</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#0f172a", color: "#e6eef8", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(data.slice(0, 20), null, 2)}
          </pre>
        </section>
      )}

      <section style={{ marginTop: 20 }}>
        <h3>How to use the JSON in your page</h3>
        <ol>
          <li>Call <code>fetchSheetAsJson()</code> server-side (as done here). It returns an array of objects.</li>
          <li>Map/filter/format the array to shape it how your UI needs it.</li>
          <li>For client-side dynamic updates, create an API route that calls <code>fetchSheetAsJson</code> and then fetch it from the client.</li>
        </ol>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>If the sheet is private</h3>
        <p>
          This approach requires the sheet to be viewable by anyone with the link. If the sheet is private, use the
          Google Sheets API with a service account and call it server-side. Steps:
        </p>
        <ol>
          <li>Create a Google Cloud project and enable the Google Sheets API.</li>
          <li>Create a service account, generate a JSON key, and store it on the server (or in secret manager).</li>
          <li>Share the sheet with the service account email (viewer).
          </li>
          <li>Use the official Google client (googleapis) on the server to fetch values: <code>google.sheets({version: 'v4'})</code>.</li>
        </ol>
      </section>
    </main>
  );
}

/**
 * ---- Private Sheets: Minimal server-side example (not included in the default page) ----
 *
 * import { google } from 'googleapis';
 *
 * async function fetchPrivateSheet(authJsonPath, spreadsheetId, range) {
 *   const auth = new google.auth.GoogleAuth({ keyFile: authJsonPath, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
 *   const sheets = google.sheets({ version: 'v4', auth });
 *   const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
 *   // res.data.values is an array of rows (arrays)
 * }
 *
 * Steps: install `npm i googleapis` and keep the key file secure. Use server-side only.
 */
