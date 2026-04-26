/**
 * Minutes of Meeting – Word document generator
 * Supports Arabic (RTL) and English (LTR) output.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
  PageOrientation,
  ImageRun,
  Header,
} from 'docx';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// ─── Colours ───────────────────────────────────────────────────
const DEFAULT_COLOR = {
  primary:   '0B4F6C',
  secondary: '1A7FA1',
  accent:    '2EADD3',
  white:     'FFFFFF',
  altRow:    'F4F9FB',
  text:      '1E293B',
  subtext:   '64748B',
  border:    'CBD5E1',
  success:   '16A34A',
  warning:   'F59E0B',
};

// ─── Bilingual labels ──────────────────────────────────────────
const LABELS = {
  AR: {
    docTitle:           '\u0645\u062d\u0636\u0631 \u0627\u062c\u062a\u0645\u0627\u0639',
    docTitleSub:        'Minutes of Meeting',
    meetingInfo:        '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639',
    subject:            '\u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639',
    dateTime:           '\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u0648\u0627\u0644\u0648\u0642\u062a',
    location:           '\u0627\u0644\u0645\u0643\u0627\u0646 / \u0627\u0644\u0631\u0627\u0628\u0637',
    facilitator:        '\u0645\u062f\u064a\u0631 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639',
    attendanceSection:  '\u0627\u0644\u062d\u0636\u0648\u0631 \u0648\u0627\u0644\u063a\u064a\u0627\u0628 \u2013 \u0627\u0644\u0623\u0639\u0636\u0627\u0621',
    noCol:              '#',
    nameCol:            '\u0627\u0644\u0627\u0633\u0645',
    roleCol:            '\u0627\u0644\u062f\u0648\u0631 / \u0627\u0644\u0635\u0641\u0629',
    statusCol:          '\u0627\u0644\u062d\u0636\u0648\u0631',
    absentSection:      '\u0627\u0644\u063a\u064a\u0627\u0628',
    reasonCol:          '\u0627\u0644\u0633\u0628\u0628',
    present:            '\u2714 \u062d\u0627\u0636\u0631',
    absent:             '\u2717 \u063a\u0627\u0626\u0628',
    keyPointsSection:   '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639 \u2013 \u0623\u0628\u0631\u0632 \u0627\u0644\u0646\u0642\u0627\u0637',
    noKeyPoints:        '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u0642\u0627\u0637 \u0645\u0633\u062c\u0644\u0629',
    actionSection:      '\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0642\u0627\u062f\u0645\u0629',
    taskCol:            '\u0627\u0644\u0645\u0647\u0645\u0629',
    assignedCol:        '\u0645\u0633\u0646\u062f\u0629 \u0625\u0644\u0649',
    dueDateCol:         '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0645\u062e\u0637\u0637',
    statusLabel:        '\u0627\u0644\u062d\u0627\u0644\u0629',
    noTasks:            '\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0647\u0627\u0645',
    notesSection:       '\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629',
    signaturesSection:  '\u0627\u0644\u062a\u0648\u0642\u064a\u0639\u0627\u062a',
    meetingManager:     '\u0645\u062f\u064a\u0631 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639',
    directManager:      '\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631',
    noData:             '\u2014',
    statusOpen:         '\u0645\u0641\u062a\u0648\u062d',
    statusInProgress:   '\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630',
    statusDone:         '\u0645\u0643\u062a\u0645\u0644',
    statusCancelled:    '\u0645\u0644\u063a\u0649',
    statusNew:          '\u062c\u062f\u064a\u062f',
  },
  EN: {
    docTitle:           'Minutes of Meeting',
    docTitleSub:        '\u0645\u062d\u0636\u0631 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639',
    meetingInfo:        'Meeting Information',
    subject:            'Meeting Subject',
    dateTime:           'Date & Time',
    location:           'Location / Link',
    facilitator:        'Facilitator',
    attendanceSection:  'Attendance',
    noCol:              '#',
    nameCol:            'Name',
    roleCol:            'Role / Title',
    statusCol:          'Status',
    absentSection:      'Absentees',
    reasonCol:          'Reason',
    present:            '\u2714 Present',
    absent:             '\u2717 Absent',
    keyPointsSection:   'Key Points',
    noKeyPoints:        'No points recorded',
    actionSection:      'Action Items',
    taskCol:            'Task',
    assignedCol:        'Assigned To',
    dueDateCol:         'Due Date',
    statusLabel:        'Status',
    noTasks:            'No action items',
    notesSection:       'Notes',
    signaturesSection:  'Signatures',
    meetingManager:     'Meeting Manager',
    directManager:      'Direct Manager',
    noData:             '\u2014',
    statusOpen:         'Open',
    statusInProgress:   'In Progress',
    statusDone:         'Done',
    statusCancelled:    'Cancelled',
    statusNew:          'New',
  },
} as const;

// ─── Data interface ────────────────────────────────────────────
export interface MoMTemplateConfig {
  primaryColor?:   string;
  secondaryColor?: string;
  accentColor?:    string;
  companyName?:    string;
  headerText?:     string;
  footerText?:     string;
  logoUrlLeft?:    string;
  logoUrlRight?:   string;
}

export interface MoMData {
  projectName: string;
  title: string;
  meetingDate: Date | string;
  location?: string;
  facilitator?: string;
  attendees: { name: string; role?: string; attended?: boolean }[];
  absentees: { name: string; role?: string; reason?: string }[];
  keyPoints: { point: string }[];
  actionItems: { task: string; dueDate?: string; assignedTo?: string; status?: string }[];
  notes?: string;
  language?: 'AR' | 'EN';
  template?: MoMTemplateConfig;
  logoLeftPath?: string;
  logoRightPath?: string;
  /** Full filesystem path to the uploaded master .docx template */
  masterTemplatePath?: string;
  /** Full filesystem path to a logo image to inject into header images */
  headerLogoPath?: string;
}

// ─── Main export ───────────────────────────────────────────────
export async function generateMoMDocx(data: MoMData): Promise<Buffer> {
  const isAR  = (data.language ?? 'AR') === 'AR';
  const L     = LABELS[isAR ? 'AR' : 'EN'];
  const align = isAR ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const font  = isAR ? 'Segoe UI' : 'Calibri';

  // Merge custom template colors over defaults
  const tmpl = data.template || {};
  const COLOR = {
    ...DEFAULT_COLOR,
    primary:   tmpl.primaryColor   || DEFAULT_COLOR.primary,
    secondary: tmpl.secondaryColor || DEFAULT_COLOR.secondary,
    accent:    tmpl.accentColor    || DEFAULT_COLOR.accent,
  };

  // ─── Formatters ─────────────────────────────────────────────
  function fmtDateTime(d: Date | string | null | undefined): string {
    if (!d) return L.noData;
    const dt = new Date(d);
    return isAR
      ? dt.toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })
      : dt.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
  }

  function resolveStatusLabel(s?: string): string {
    switch (s) {
      case 'OPEN':        return L.statusOpen;
      case 'IN_PROGRESS': return L.statusInProgress;
      case 'DONE':        return L.statusDone;
      case 'CANCELLED':   return L.statusCancelled;
      default:            return s || L.statusNew;
    }
  }

  function resolveStatusColor(s?: string): string {
    switch (s) {
      case 'DONE':        return COLOR.success;
      case 'IN_PROGRESS': return COLOR.secondary;
      case 'CANCELLED':   return COLOR.subtext;
      default:            return COLOR.warning;
    }
  }

  // ─── Shared borders ──────────────────────────────────────────
  const TABLE_BORDERS = {
    top:              { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
    bottom:           { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
    left:             { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
    right:            { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLOR.border },
    insideVertical:   { style: BorderStyle.SINGLE, size: 1, color: COLOR.border },
  };

  // ─── Cell helpers (closure over isAR / align / font) ────────
  function hCell(text: string, widthPct: number): TableCell {
    return new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: COLOR.primary, fill: COLOR.primary },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: isAR,
        children: [new TextRun({ text, bold: true, size: 19, color: COLOR.white, font })],
      })],
    });
  }

  function dCell(text: string, widthPct: number, shaded = false, center = false): TableCell {
    return new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      shading: shaded ? { type: ShadingType.SOLID, color: COLOR.altRow, fill: COLOR.altRow } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        alignment: center ? AlignmentType.CENTER : align,
        bidirectional: isAR,
        children: [new TextRun({ text: text || L.noData, size: 19, color: COLOR.text, font })],
      })],
    });
  }

  function sectionHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: 240, after: 120 },
      shading: { type: ShadingType.SOLID, color: COLOR.secondary, fill: COLOR.secondary },
      alignment: align,
      bidirectional: isAR,
      children: [new TextRun({ text: `  ${title}  `, bold: true, size: 22, color: COLOR.white, font })],
    });
  }

  function emptyRow(): Paragraph {
    return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun('')] });
  }

  function infoRow(label: string, value: string, shade = false): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: shade ? COLOR.altRow : 'F8FCFE', fill: shade ? COLOR.altRow : 'F8FCFE' },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: align,
            bidirectional: isAR,
            children: [new TextRun({ text: label, bold: true, size: 20, color: COLOR.primary, font })],
          })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          shading: shade ? { type: ShadingType.SOLID, color: COLOR.altRow, fill: COLOR.altRow } : undefined,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: align,
            bidirectional: isAR,
            children: [new TextRun({ text: value || L.noData, size: 20, color: COLOR.text, font })],
          })],
        }),
      ],
    });
  }

  // ─── Logo images ─────────────────────────────────────────────
  const headerObjs: any[] = [];
  if (data.logoLeftPath && fs.existsSync(data.logoLeftPath)) {
    const imgData = fs.readFileSync(data.logoLeftPath);
    const ext = path.extname(data.logoLeftPath).toLowerCase().replace('.', '') as any;
    headerObjs.push(new ImageRun({ data: imgData, transformation: { width: 60, height: 60 }, type: ext }));
    headerObjs.push(new TextRun({ text: '   ', font }));
  }
  if (data.logoRightPath && fs.existsSync(data.logoRightPath)) {
    const imgData = fs.readFileSync(data.logoRightPath);
    const ext = path.extname(data.logoRightPath).toLowerCase().replace('.', '') as any;
    headerObjs.push(new TextRun({ text: '   ', font }));
    headerObjs.push(new ImageRun({ data: imgData, transformation: { width: 60, height: 60 }, type: ext }));
  }

  // ─── Title block ─────────────────────────────────────────────
  const displayCompany = tmpl.companyName || data.projectName;
  const titlePara = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 160 },
    shading: { type: ShadingType.SOLID, color: COLOR.primary, fill: COLOR.primary },
    children: [
      ...(tmpl.headerText ? [new TextRun({ text: tmpl.headerText + '  |  ', bold: true, size: 22, color: COLOR.accent, font })] : []),
      new TextRun({ text: L.docTitle, bold: true, size: 32, color: COLOR.white, font }),
      new TextRun({ text: `  |  ${L.docTitleSub}`, bold: true, size: 22, color: COLOR.accent, font: 'Segoe UI' }),
    ],
  });

  const projectPara = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 200 },
    children: [new TextRun({ text: displayCompany, bold: true, size: 26, color: COLOR.secondary, font })],
  });

  // ─── Meeting info table ───────────────────────────────────────
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      infoRow(L.subject,     data.title),
      infoRow(L.dateTime,    fmtDateTime(data.meetingDate), true),
      infoRow(L.location,    data.location    || L.noData),
      infoRow(L.facilitator, data.facilitator || L.noData, true),
    ],
  });

  // ─── Attendees ───────────────────────────────────────────────
  const attendeesRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [hCell(L.noCol, 8), hCell(L.nameCol, 46), hCell(L.roleCol, 30), hCell(L.statusCol, 16)],
    }),
    ...data.attendees.map((a, i) =>
      new TableRow({
        children: [
          dCell((i + 1).toString(),                        8,  i % 2 !== 0, true),
          dCell(a.name,                                    46, i % 2 !== 0),
          dCell(a.role || L.noData,                        30, i % 2 !== 0),
          dCell(a.attended === false ? L.absent : L.present, 16, i % 2 !== 0, true),
        ],
      })
    ),
  ];
  if (data.attendees.length === 0) {
    attendeesRows.push(new TableRow({ children: [dCell(L.noData, 100)] }));
  }
  const attendeesTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: TABLE_BORDERS, rows: attendeesRows });

  // ─── Absentees ───────────────────────────────────────────────
  const absenteeSection: any[] = [];
  if (data.absentees.length > 0) {
    absenteeSection.push(sectionHeading(L.absentSection));
    const abRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [hCell(L.noCol, 8), hCell(L.nameCol, 46), hCell(L.roleCol, 30), hCell(L.reasonCol, 16)],
      }),
      ...data.absentees.map((a, i) =>
        new TableRow({
          children: [
            dCell((i + 1).toString(), 8,  i % 2 !== 0, true),
            dCell(a.name,             46, i % 2 !== 0),
            dCell(a.role || L.noData, 30, i % 2 !== 0),
            dCell(a.reason || L.noData, 16, i % 2 !== 0),
          ],
        })
      ),
    ];
    absenteeSection.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: TABLE_BORDERS, rows: abRows }));
    absenteeSection.push(emptyRow());
  }

  // ─── Key points ───────────────────────────────────────────────
  const keyPointsContent: any[] = [];
  if (data.keyPoints.length === 0) {
    keyPointsContent.push(new Paragraph({
      alignment: align,
      bidirectional: isAR,
      children: [new TextRun({ text: L.noKeyPoints, italics: true, size: 20, color: COLOR.subtext, font })],
    }));
  } else {
    data.keyPoints.forEach((kp, i) => {
      keyPointsContent.push(new Paragraph({
        spacing: { before: 80, after: 80 },
        alignment: align,
        bidirectional: isAR,
        shading: i % 2 !== 0 ? { type: ShadingType.SOLID, color: COLOR.altRow, fill: COLOR.altRow } : undefined,
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20, color: COLOR.secondary, font }),
          new TextRun({ text: kp.point, size: 20, color: COLOR.text, font }),
        ],
      }));
    });
  }

  // ─── Action items ─────────────────────────────────────────────
  const actionRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        hCell(L.noCol,       6),
        hCell(L.taskCol,     40),
        hCell(L.assignedCol, 22),
        hCell(L.dueDateCol,  20),
        hCell(L.statusLabel, 12),
      ],
    }),
    ...data.actionItems.map((a, i) =>
      new TableRow({
        children: [
          dCell((i + 1).toString(),        6,  i % 2 !== 0, true),
          dCell(a.task,                    40, i % 2 !== 0),
          dCell(a.assignedTo || L.noData,  22, i % 2 !== 0),
          dCell(a.dueDate    || L.noData,  20, i % 2 !== 0, true),
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            shading: i % 2 !== 0 ? { type: ShadingType.SOLID, color: COLOR.altRow, fill: COLOR.altRow } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({
                text: resolveStatusLabel(a.status),
                bold: true, size: 17,
                color: resolveStatusColor(a.status),
                font,
              })],
            })],
          }),
        ],
      })
    ),
  ];
  if (data.actionItems.length === 0) {
    actionRows.push(new TableRow({ children: [dCell(L.noTasks, 100)] }));
  }
  const actionTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: TABLE_BORDERS, rows: actionRows });

  // ─── Notes ────────────────────────────────────────────────────
  const notesContent: any[] = [];
  if (data.notes) {
    notesContent.push(new Paragraph({
      spacing: { before: 80, after: 80 },
      alignment: align,
      bidirectional: isAR,
      shading: { type: ShadingType.SOLID, color: 'FFFDE7', fill: 'FFFDE7' },
      children: [new TextRun({ text: data.notes, size: 20, color: COLOR.text, font })],
    }));
  }

  // ─── Footer ───────────────────────────────────────────────────
  const footerText = tmpl.footerText || `${displayCompany}  |  ${L.docTitle}`;
  const footerLine = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: COLOR.border } },
    children: [new TextRun({ text: footerText, size: 16, color: COLOR.subtext, font })],
  });

  // ─── Assemble document ────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run:       { font },
          paragraph: { alignment: align },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.PORTRAIT },
            margin: {
              top:    convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left:   convertInchesToTwip(0.9),
              right:  convertInchesToTwip(0.9),
            },
          },
        },
        ...(headerObjs.length > 0 ? {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  bidirectional: isAR,
                  children: headerObjs,
                }),
              ],
            }),
          },
        } : {}),
        children: [
          titlePara,
          projectPara,
          emptyRow(),

          sectionHeading(L.meetingInfo),
          infoTable,
          emptyRow(),

          sectionHeading(L.attendanceSection),
          attendeesTable,
          emptyRow(),

          ...absenteeSection,

          sectionHeading(L.keyPointsSection),
          ...keyPointsContent,
          emptyRow(),

          sectionHeading(L.actionSection),
          actionTable,
          emptyRow(),

          ...(data.notes ? [sectionHeading(L.notesSection), ...notesContent, emptyRow()] : []),

          sectionHeading(L.signaturesSection),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top:            { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
              bottom:         { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
              left:           { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
              right:          { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLOR.border },
            },
            rows: [
              new TableRow({
                children: [hCell(L.meetingManager, 50), hCell(L.directManager, 50)],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ spacing: { before: 400, after: 400 }, children: [new TextRun('')] })],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ spacing: { before: 400, after: 400 }, children: [new TextRun('')] })],
                  }),
                ],
              }),
            ],
          }),

          emptyRow(),
          footerLine,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  // ─── Inject master template styles, borders, headers & footers ───
  if (data.masterTemplatePath && fs.existsSync(data.masterTemplatePath)) {
    try {
      const generatedZip = new AdmZip(buffer);
      const masterZip   = new AdmZip(data.masterTemplatePath);

      // 1. Inject word/styles.xml
      const masterStyles = masterZip.getEntry('word/styles.xml');
      if (masterStyles) {
        if (generatedZip.getEntry('word/styles.xml')) generatedZip.deleteFile('word/styles.xml');
        generatedZip.addFile('word/styles.xml', masterStyles.getData());
      }

      // 2. Inject word/theme/theme1.xml
      const masterTheme = masterZip.getEntry('word/theme/theme1.xml');
      if (masterTheme) {
        if (generatedZip.getEntry('word/theme/theme1.xml')) generatedZip.deleteFile('word/theme/theme1.xml');
        generatedZip.addFile('word/theme/theme1.xml', masterTheme.getData());
      }

      // 3. Copy all headers, footers, their rels, and media from master
      for (const entry of masterZip.getEntries()) {
        const name = entry.entryName;
        const isHF    = /^word\/(header|footer)\d*\.xml$/.test(name);
        const isHFRel = /^word\/_rels\/(header|footer)\d*\.xml\.rels$/.test(name);
        const isMedia = name.startsWith('word/media/');
        if (isHF || isHFRel || isMedia) {
          if (generatedZip.getEntry(name)) generatedZip.deleteFile(name);
          generatedZip.addFile(name, entry.getData());
        }
      }

      // 3b. Replace OR inject logo into document headers
      if (data.headerLogoPath && fs.existsSync(data.headerLogoPath)) {
        const logoBuffer    = fs.readFileSync(data.headerLogoPath);
        const logoExt       = path.extname(data.headerLogoPath).toLowerCase().replace('.', '') || 'png';
        const logoMediaName = `header_logo.${logoExt}`;
        const logoMediaPath = `word/media/${logoMediaName}`;

        // ── Try to replace existing images in header rels ──
        const replacedMedia = new Set<string>();
        for (const entry of generatedZip.getEntries()) {
          if (!/^word\/_rels\/(header)\d*\.xml\.rels$/.test(entry.entryName)) continue;
          const relsXml   = entry.getData().toString('utf8');
          const imageRefs = [...relsXml.matchAll(/<Relationship[^>]+Type="[^"]*\/image"[^>]+Target="([^"]+)"[^>]*\/>/g)];
          for (const [, target] of imageRefs) {
            const mediaPath = 'word/' + target.replace(/^\.\.\//, '');
            if (!replacedMedia.has(mediaPath) && generatedZip.getEntry(mediaPath)) {
              generatedZip.deleteFile(mediaPath);
              generatedZip.addFile(mediaPath, logoBuffer);
              replacedMedia.add(mediaPath);
            }
          }
        }

        // ── If no images were replaced, inject logo into header1.xml ──
        if (replacedMedia.size === 0) {
          const logoRelId       = 'rIdHdrLogo1';
          const headerEntry     = generatedZip.getEntry('word/header1.xml');
          const headerRelsEntry = generatedZip.getEntry('word/_rels/header1.xml.rels');
          if (headerEntry && headerRelsEntry) {
            // Add logo to media
            if (generatedZip.getEntry(logoMediaPath)) generatedZip.deleteFile(logoMediaPath);
            generatedZip.addFile(logoMediaPath, logoBuffer);

            // Inject relationship
            let relsXml = headerRelsEntry.getData().toString('utf8');
            const relEntry = `<Relationship Id="${logoRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${logoMediaName}"/>`;
            relsXml = relsXml.replace('</Relationships>', relEntry + '</Relationships>');
            generatedZip.deleteFile('word/_rels/header1.xml.rels');
            generatedZip.addFile('word/_rels/header1.xml.rels', Buffer.from(relsXml, 'utf8'));

            // Inject inline image paragraph at start of header
            const cx = 914400; const cy = 457200; // 1 inch × 0.5 inch in EMU
            const logoParaXml = `<w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="100" name="HeaderLogo"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="100" name="HeaderLogo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${logoRelId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
            let headerXml = headerEntry.getData().toString('utf8');
            headerXml = headerXml.replace(/(<w:hdr[^>]*>)/, `$1${logoParaXml}`);
            generatedZip.deleteFile('word/header1.xml');
            generatedZip.addFile('word/header1.xml', Buffer.from(headerXml, 'utf8'));
          }
        }
      }

      // 4. Extract <w:sectPr> from master document.xml and inject into generated
      const masterDocEntry    = masterZip.getEntry('word/document.xml');
      const generatedDocEntry = generatedZip.getEntry('word/document.xml');
      if (masterDocEntry && generatedDocEntry) {
        const masterDocXml    = masterDocEntry.getData().toString('utf8');
        let   generatedDocXml = generatedDocEntry.getData().toString('utf8');
        const sectPrMatch = masterDocXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
        if (sectPrMatch) {
          if (generatedDocXml.includes('<w:sectPr')) {
            generatedDocXml = generatedDocXml.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/, sectPrMatch[0]);
          } else {
            generatedDocXml = generatedDocXml.replace('</w:body>', sectPrMatch[0] + '</w:body>');
          }
          generatedZip.deleteFile('word/document.xml');
          generatedZip.addFile('word/document.xml', Buffer.from(generatedDocXml, 'utf8'));
        }
      }

      // 5. Merge header/footer relationships from master into generated rels
      const masterRelsEntry    = masterZip.getEntry('word/_rels/document.xml.rels');
      const generatedRelsEntry = generatedZip.getEntry('word/_rels/document.xml.rels');
      if (masterRelsEntry && generatedRelsEntry) {
        const masterRelsXml    = masterRelsEntry.getData().toString('utf8');
        let   generatedRelsXml = generatedRelsEntry.getData().toString('utf8');

        // Find next safe rId
        const existingNums = [...generatedRelsXml.matchAll(/Id="rId(\d+)"/g)].map(m => parseInt(m[1]));
        let nextId = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 10;

        // Extract master header/footer rels and remap IDs to avoid collisions
        const masterHFRels = [...masterRelsXml.matchAll(/<Relationship\s+Id="([^"]+)"\s+Type="([^"]*\/(header|footer))"\s+Target="([^"]+)"\s*\/>/g)];
        const idMap: Record<string, string> = {};
        for (const m of masterHFRels) {
          const [, oldId, type, , target] = m;
          const newId = `rId${nextId++}`;
          idMap[oldId] = newId;
          generatedRelsXml = generatedRelsXml.replace(
            '</Relationships>',
            `<Relationship Id="${newId}" Type="${type}" Target="${target}"/>\n</Relationships>`
          );
        }

        // Update sectPr r:id references in document.xml to use remapped IDs
        if (Object.keys(idMap).length > 0) {
          const genDocEntry2 = generatedZip.getEntry('word/document.xml');
          if (genDocEntry2) {
            let docXml = genDocEntry2.getData().toString('utf8');
            for (const [oldId, newId] of Object.entries(idMap)) {
              docXml = docXml.split(`r:id="${oldId}"`).join(`r:id="${newId}"`);
              docXml = docXml.split(`r:id='${oldId}'`).join(`r:id='${newId}'`);
            }
            generatedZip.deleteFile('word/document.xml');
            generatedZip.addFile('word/document.xml', Buffer.from(docXml, 'utf8'));
          }
        }

        generatedZip.deleteFile('word/_rels/document.xml.rels');
        generatedZip.addFile('word/_rels/document.xml.rels', Buffer.from(generatedRelsXml, 'utf8'));
      }

      return generatedZip.toBuffer();
    } catch (e) {
      console.warn('[momGenerator] Could not inject master template:', e);
    }
  }

  return buffer;
}
