/**
 * MOM Template Generator – fills a user-provided .docx template using docxtemplater.
 * All backgrounds, images, headers, and footers from the template are preserved.
 *
 * Template placeholder tags (add these inside your Word document):
 *
 * ── Single values ─────────────────────────────────────────────────────────────
 *   {title}           Meeting subject / title
 *   {projectName}     Project name
 *   {meetingDate}     Formatted meeting date
 *   {location}        Location or meeting link
 *   {facilitator}     Meeting facilitator
 *   {notes}           Additional notes
 *   {generatedAt}     Document generation timestamp
 *
 * ── Loops (place in a table row or paragraph, repeat per item) ────────────────
 *   {#attendees}
 *     {attendeeName}  {attendeeRole}  {attendeeStatus}
 *   {/attendees}
 *
 *   {#absentees}
 *     {absenteeName}  {absenteeRole}  {absenteeReason}
 *   {/absentees}
 *
 *   {#keyPoints}
 *     {kpIndex}  {kpText}
 *   {/keyPoints}
 *
 *   {#actionItems}
 *     {aiIndex}  {aiTask}  {aiAssignedTo}  {aiDueDate}  {aiStatus}
 *   {/actionItems}
 *
 * ── Conditional blocks ────────────────────────────────────────────────────────
 *   {#hasNotes}   ... {notes} ...  {/hasNotes}
 *   {#hasAbsentees} ...           {/hasAbsentees}
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';

// ─── Status label maps ────────────────────────────────────────────────────────
const STATUS_AR: Record<string, string> = {
  OPEN:        'مفتوح',
  IN_PROGRESS: 'قيد التنفيذ',
  DONE:        'مكتمل',
  CANCELLED:   'ملغى',
};
const STATUS_EN: Record<string, string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  DONE:        'Done',
  CANCELLED:   'Cancelled',
};

export interface MoMTemplateData {
  projectName: string;
  title: string;
  meetingDate: Date | string;
  location?: string;
  facilitator?: string;
  language?: 'AR' | 'EN';
  attendees: { name: string; role?: string; attended?: boolean }[];
  absentees: { name: string; role?: string; reason?: string }[];
  keyPoints: { point: string }[];
  actionItems: { task: string; dueDate?: string; assignedTo?: string; status?: string }[];
  notes?: string;
}

function fmtDate(d: Date | string, lang: 'AR' | 'EN'): string {
  const dt = new Date(d);
  return lang === 'AR'
    ? dt.toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })
    : dt.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
}

/**
 * STEP 1 — Simplify tag-only cells.
 *
 * Word's spell/grammar checker splits text runs at arbitrary points, so
 * {#attendees} might be stored across several <w:r> elements with <w:proofErr>
 * markers in between, making the tag impossible to find as a complete string.
 *
 * For cells whose assembled text is PURELY template tags (no regular prose),
 * this function collapses all split runs into a single clean <w:r><w:t> run.
 */
function simplifyTagOnlyCells(xml: string): string {
  return xml.replace(
    /(<w:tc\b[^>]*>)([\s\S]*?)(<\/w:tc>)/g,
    (match, tcOpen, tcInner, tcClose) => {
      // Assemble text from all <w:t> elements (strip every XML tag)
      const text = tcInner
        .replace(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g, '$1')
        .replace(/<[^>]+>/g, '');

      // Only simplify cells where ALL text (ignoring whitespace) is template tags
      const stripped = text.replace(/\s+/g, '');
      if (!stripped.startsWith('{') || stripped.replace(/\{[^}]+\}/g, '') !== '') {
        return match;
      }

      // Preserve cell and paragraph formatting properties
      const tcPrMatch = tcInner.match(/<w:tcPr\b[\s\S]*?<\/w:tcPr>/);
      const tcPr = tcPrMatch ? tcPrMatch[0] : '';
      const pPrMatch  = tcInner.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/);
      const pPr  = pPrMatch  ? pPrMatch[0]  : '';

      return (
        `${tcOpen}${tcPr}` +
        `<w:p>${pPr}<w:r><w:t xml:space="preserve">${stripped}</w:t></w:r></w:p>` +
        `${tcClose}`
      );
    },
  );
}

/**
 * STEP 2 — Fix RTL table loop ordering.
 *
 * In Arabic (RTL) Word tables, cells are stored RIGHT-TO-LEFT in XML, so the
 * rightmost visible cell is FIRST in XML order. If a user places {/loop} in
 * the rightmost cell and {#loop} in the leftmost, docxtemplater sees the
 * closing tag before the opening tag → "unopened loop" error.
 *
 * After simplifyTagOnlyCells() the tags are intact single strings, so this
 * function can safely detect and swap any inverted pair within each table row.
 */
function fixRtlTableRowLoops(xml: string): string {
  return xml.replace(
    /(<w:tr\b[^>]*>)([\s\S]*?)(<\/w:tr>)/g,
    (_match, trOpen, trBody, trClose) => {
      let body = trBody;

      // Collect all {#name} and {/name} tags with their positions
      const tagRe = /\{([#/])(\w+)\}/g;
      const found: Array<{ type: '#' | '/'; name: string; pos: number }> = [];
      let m: RegExpExecArray | null;
      while ((m = tagRe.exec(body)) !== null) {
        found.push({ type: m[1] as '#' | '/', name: m[2], pos: m.index });
      }

      // For each loop name, swap if the closer appears before the opener
      const names = new Set(found.map(f => f.name));
      for (const name of names) {
        const opener = found.find(f => f.name === name && f.type === '#');
        const closer = found.find(f => f.name === name && f.type === '/');
        if (!opener || !closer || closer.pos >= opener.pos) continue;

        // RTL table: closer is before opener in XML — swap them
        const openStr  = `{#${name}}`;
        const closeStr = `{/${name}}`;
        const ph = `\x01${name}_PH\x01`;
        body = body
          .replace(closeStr, ph)       // 1. mark the closer
          .replace(openStr, closeStr)  // 2. move opener text to closer position
          .replace(ph, openStr);       // 3. place opener text where closer was
      }

      return trOpen + body + trClose;
    },
  );
}

/**
 * Loads the .docx template from `templatePath`, fills all {placeholders} with
 * MOM data, and returns the resulting buffer.
 *
 * Throws if the template file does not exist or contains unresolvable tags.
 */
export async function generateMoMFromTemplate(
  templatePath: string,
  data: MoMTemplateData,
): Promise<Buffer> {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`MOM template not found: ${templatePath}`);
  }

  const lang      = data.language ?? 'AR';
  const statusMap = lang === 'AR' ? STATUS_AR : STATUS_EN;
  const noData    = lang === 'AR' ? '—' : '—';
  const present   = lang === 'AR' ? '✔ حاضر' : '✔ Present';
  const absent    = lang === 'AR' ? '✘ غائب'  : '✘ Absent';

  // Build the flat data object that docxtemplater will use
  const templateData = {
    // ── Single values ──────────────────────────────────────────────────────────
    title:         data.title,
    projectName:   data.projectName,
    meetingDate:   fmtDate(data.meetingDate, lang),
    location:      data.location    || noData,
    facilitator:   data.facilitator || noData,
    notes:         data.notes       || '',
    generatedAt:   fmtDate(new Date(), lang),

    // ── Conditionals ──────────────────────────────────────────────────────────
    hasNotes:      !!(data.notes && data.notes.trim()),
    hasAbsentees:  data.absentees.length > 0,
    hasKeyPoints:  data.keyPoints.length > 0,
    hasActionItems: data.actionItems.length > 0,

    // ── Attendees loop ─────────────────────────────────────────────────────────
    attendees: data.attendees.map((a, i) => ({
      attendeeIndex:  String(i + 1),
      attendeeName:   a.name,
      attendeeRole:   a.role    || noData,
      attendeeStatus: a.attended === false ? absent : present,
    })),

    // ── Absentees loop ─────────────────────────────────────────────────────────
    absentees: data.absentees.map((a, i) => ({
      absenteeIndex:  String(i + 1),
      absenteeName:   a.name,
      absenteeRole:   a.role   || noData,
      absenteeReason: a.reason || noData,
    })),

    // ── Key points loop ────────────────────────────────────────────────────────
    keyPoints: data.keyPoints.map((kp, i) => ({
      kpIndex: String(i + 1),
      kpText:  kp.point,
    })),

    // ── Action items loop ──────────────────────────────────────────────────────
    actionItems: data.actionItems.map((ai, i) => ({
      aiIndex:      String(i + 1),
      aiTask:       ai.task,
      aiAssignedTo: ai.assignedTo || noData,
      aiDueDate:    ai.dueDate    || noData,
      aiStatus:     statusMap[ai.status || 'OPEN'] || ai.status || noData,
    })),
  };

  const content  = fs.readFileSync(templatePath);
  const zip      = new PizZip(content);

  // ── Auto-fix RTL table loop ordering (two-pass) ─────────────────────────
  // Pass 1: collapse split XML runs in tag-only cells so tags become findable.
  // Pass 2: swap any inverted {#name}/{/name} pairs (RTL Arabic table cells
  //         are stored right-to-left in XML, reversing the loop boundary order).
  const docXmlEntry = zip.file('word/document.xml');
  if (docXmlEntry) {
    let docXml = docXmlEntry.asText();
    docXml = simplifyTagOnlyCells(docXml);
    docXml = fixRtlTableRowLoops(docXml);
    zip.file('word/document.xml', docXml);
  }

  let docx: Docxtemplater;
  try {
    docx = new Docxtemplater(zip, {
      paragraphLoop: true,   // each loop iteration gets its own paragraph
      linebreaks:    true,   // convert \n to Word line breaks
      nullGetter:    () => '', // replace unresolved tags with empty string
    });
  } catch (compileErr: any) {
    // Extract readable info from docxtemplater multi-errors
    const problems: string[] = [];
    const errs: any[] = compileErr?.properties?.errors ?? [compileErr];
    for (const e of errs) {
      const p = e?.properties;
      if (p?.explanation) problems.push(p.explanation);
      else if (e?.message)  problems.push(e.message);
    }
    throw new Error(
      `MOM template has tag errors — please fix the .docx and re-upload.\n` +
      problems.map(s => `  • ${s}`).join('\n'),
    );
  }

  try {
    docx.render(templateData);
  } catch (renderErr: any) {
    const problems: string[] = [];
    const errs: any[] = renderErr?.properties?.errors ?? [renderErr];
    for (const e of errs) {
      const p = e?.properties;
      if (p?.explanation) problems.push(p.explanation);
      else if (e?.message)  problems.push(e.message);
    }
    throw new Error(
      `MOM template render failed — please fix the .docx and re-upload.\n` +
      problems.map(s => `  • ${s}`).join('\n'),
    );
  }

  const out = docx.getZip().generate({
    type:        'nodebuffer',
    compression: 'DEFLATE',
  });

  return out as Buffer;
}
