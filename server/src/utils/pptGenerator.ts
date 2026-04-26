import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { DEFAULT_REPORT_TEMPLATE, ReportTemplateConfig } from './reportTemplateConfig';

// ============================================
// COLORS & THEME — built dynamically from config
// ============================================
function buildTheme(cfg: ReportTemplateConfig) {
  return {
    primary: cfg.colors.primary,
    secondary: cfg.colors.secondary,
    accent: cfg.colors.accent,
    dark: '1E293B',
    text: '334155',
    lightText: '94A3B8',
    white: 'FFFFFF',
    lightBg: 'F1F5F9',
    cardBg: 'F8FAFC',
    success: cfg.colors.success,
    warning: cfg.colors.warning,
    danger: cfg.colors.danger,
    headerTitle: (cfg.colors as any).headerTitle || 'FFFFFF',
    info: '2563EB',
    headerBg: '0F172A',
    tableBorder: 'CBD5E1',
    tableHeaderBg: cfg.colors.primary,
    tableAltRow: 'F1F5F9',
  };
}

// Keep a module-level reference so helpers can use it (set before slide generation)
let THEME = buildTheme(DEFAULT_REPORT_TEMPLATE);
// IS_RTL: true for Arabic/bilingual, false for English — set per-generation
let IS_RTL = true;

// ============================================
// HELPER: Add slide header title text
// (The colored bar comes from the master layout)
// ============================================
function addSlideHeader(slide: any, title: string) {
  slide.addText(title, {
    x: 1.0, y: 0.1, w: 11.2, h: 0.6,
    fontSize: 22, bold: true, color: THEME.headerTitle,
    align: IS_RTL ? 'right' : 'left',
    rtlMode: IS_RTL,
  });
}

// ============================================
// MASTER LAYOUTS: Define all 5 slide master layouts
// Each layout controls background, structural bars, logos, and H/F images
// ============================================
export type MasterLayoutName =
  | 'MASTER_COVER'
  | 'MASTER_BLANK'
  | 'MASTER_CONTENT_EMPTY'
  | 'MASTER_TITLE_AND_CONTENT'
  | 'MASTER_SECTION_TITLE';

function defineMasterLayouts(pptx: PptxGenJS, cfg: ReportTemplateConfig) {
  const resolvePath = (relUrl: string) => path.join(__dirname, '../../public', relUrl);

  // Returns a full-slide image object if a background image exists for this layout, else []
  const bgImageObjs = (layoutKey: string): any[] => {
    const url = (cfg as any).header?.[layoutKey]?.imageUrl;
    if (url) {
      const p = resolvePath(url);
      if (fs.existsSync(p)) {
        const ext = path.extname(p).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : 'png';
        const b64 = fs.readFileSync(p).toString('base64');
        return [{ image: { x: 0, y: 0, w: 13.33, h: 7.5, data: `image/${mime};base64,${b64}` } }];
      }
    }
    return [];
  };

  // Returns bkgd color (used only when no image is set)
  const bkgdColor = (layoutKey: string, fallbackColor: string): string => {
    const url = (cfg as any).header?.[layoutKey]?.imageUrl;
    if (url && fs.existsSync(resolvePath(url))) return 'FFFFFF';
    return fallbackColor;
  };

  // Small logos that fit in the 0.8" header bar
  const logoSmall = (): any[] => {
    const objs: any[] = [];
    if (cfg.logoUrlLeft)  objs.push({ image: { path: cfg.logoUrlLeft,  x: 0.15, y: 0.08, w: 0.65, h: 0.65 } });
    if (cfg.logoUrlRight) objs.push({ image: { path: cfg.logoUrlRight, x: 12.53, y: 0.08, w: 0.65, h: 0.65 } });
    return objs;
  };

  // Large logos for the full-color cover slide
  const logoCover = (): any[] => {
    const objs: any[] = [];
    if (cfg.logoUrlLeft)  objs.push({ image: { path: cfg.logoUrlLeft,  x: 0.2,  y: 0.2, w: 1.5, h: 1.5 } });
    if (cfg.logoUrlRight) objs.push({ image: { path: cfg.logoUrlRight, x: 11.6, y: 0.2, w: 1.5, h: 1.5 } });
    return objs;
  };

  // Returns true if a background image exists for this layout
  const hasBgImage = (layoutKey: string): boolean => {
    const url = (cfg as any).header?.[layoutKey]?.imageUrl;
    if (!url) return false;
    return fs.existsSync(resolvePath(url));
  };

  // ── COVER: full primary color (or custom bg), large logos ──
  pptx.defineSlideMaster({
    title: 'MASTER_COVER',
    bkgd: { color: THEME.primary },
    objects: [
      ...(!hasBgImage('cover') ? [{ rect: { x: 0, y: 0, w: '100%', h: '100%', fill: { color: THEME.primary } } }] : []),
      ...bgImageObjs('cover'),
      ...(!hasBgImage('cover') ? logoCover() : []),
    ],
  });

  // ── BLANK: white background (or custom bg) ────────────────────────────────
  pptx.defineSlideMaster({
    title: 'MASTER_BLANK',
    bkgd: { color: bkgdColor('blank', 'FFFFFF') },
    objects: [
      ...bgImageObjs('blank'),
    ],
  });

  // ── CONTENT EMPTY: primary header bar when no image, else image only ─────────
  pptx.defineSlideMaster({
    title: 'MASTER_CONTENT_EMPTY',
    bkgd: { color: bkgdColor('contentEmpty', 'FFFFFF') },
    objects: [
      ...bgImageObjs('contentEmpty'),
      ...(!hasBgImage('contentEmpty') ? [
        { rect: { x: 0, y: 0,   w: '100%', h: 0.8,  fill: { color: THEME.primary } } },
        { rect: { x: 0, y: 0.8, w: '100%', h: 0.04, fill: { color: THEME.accent } } },
        ...logoSmall(),
      ] : []),
    ],
  });

  // ── TITLE AND CONTENT: header bar when no image, else image only ────
  pptx.defineSlideMaster({
    title: 'MASTER_TITLE_AND_CONTENT',
    bkgd: { color: bkgdColor('titleAndContent', 'FFFFFF') },
    objects: [
      ...bgImageObjs('titleAndContent'),
      ...(!hasBgImage('titleAndContent') ? [
        { rect: { x: 0, y: 0,   w: '100%', h: 0.8,  fill: { color: THEME.primary } } },
        { rect: { x: 0, y: 0.8, w: '100%', h: 0.04, fill: { color: THEME.accent } } },
        ...logoSmall(),
      ] : []),
    ],
  });

  // ── SECTION TITLE: accent bars when no image, else image only ────
  pptx.defineSlideMaster({
    title: 'MASTER_SECTION_TITLE',
    bkgd: { color: bkgdColor('sectionTitle', THEME.secondary) },
    objects: [
      ...bgImageObjs('sectionTitle'),
      ...(!hasBgImage('sectionTitle') ? [
        { rect: { x: 0, y: 0,    w: '100%', h: 0.12, fill: { color: THEME.accent } } },
        { rect: { x: 0, y: 7.38, w: '100%', h: 0.12, fill: { color: THEME.accent } } },
      ] : []),
    ],
  });
}

// ============================================
// HELPER: Format date
// ============================================
function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ============================================
// HELPER: Get quarter label for a date
// ============================================
function getQuarterLabel(d: Date): string {
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

// ============================================
// HELPER: Variance indicator text
// ============================================
function varianceIndicator(planned: number, actual: number): string {
  const diff = actual - planned;
  if (diff > 0) return `+${diff.toFixed(1)}%`;
  if (diff < 0) return `${diff.toFixed(1)}%`;
  return '0%';
}

function varianceColor(planned: number, actual: number): string {
  const diff = actual - planned;
  if (diff >= 0) return THEME.success;
  if (diff >= -10) return THEME.warning;
  return THEME.danger;
}

// ============================================
// HELPER: Status color
// ============================================
function statusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': return THEME.success;
    case 'IN_PROGRESS': return THEME.info;
    case 'BLOCKED': return THEME.danger;
    case 'NOT_STARTED': return THEME.lightText;
    case 'CANCELLED': return '6B7280';
    default: return THEME.text;
  }
}

// ============================================
// HELPER: Table header cell style
// ============================================
function headerCell(text: string): any {
  return {
    text,
    options: {
      bold: true,
      color: THEME.white,
      fill: { color: THEME.tableHeaderBg },
      fontSize: 9,
      align: 'center',
      valign: 'middle',
    },
  };
}

// ============================================
// HELPER: Table data cell style
// ============================================
function dataCell(text: string, opts: any = {}): any {
  return {
    text,
    options: {
      fontSize: 8,
      color: THEME.text,
      align: 'center',
      valign: 'middle',
      ...opts,
    },
  };
}

// ============================================
// MAIN GENERATOR
// ============================================
export async function generateWeeklyReportPPT(projectId: string): Promise<Buffer> {
  console.log('[PPT Generator] Starting generation for project:', projectId);

  // ————— Load report template config from project settings —————
  const projectForConfig = await prisma.project.findUnique({
    where: { id: projectId },
    select: { settings: true },
  });
  const projSettings = (projectForConfig?.settings as any) || {};
  const cfg: ReportTemplateConfig = {
    ...DEFAULT_REPORT_TEMPLATE,
    ...projSettings.reportTemplate,
    colors: { ...DEFAULT_REPORT_TEMPLATE.colors, ...(projSettings.reportTemplate?.colors || {}) },
    slides: { ...DEFAULT_REPORT_TEMPLATE.slides, ...(projSettings.reportTemplate?.slides || {}) },
    slideLayouts: { ...DEFAULT_REPORT_TEMPLATE.slideLayouts, ...(projSettings.reportTemplate?.slideLayouts || {}) },
    slideImages: { ...DEFAULT_REPORT_TEMPLATE.slideImages, ...(projSettings.reportTemplate?.slideImages || {}) },
    logoUrlLeft: projSettings.reportTemplate?.logoUrlLeft || '',
    logoUrlRight: projSettings.reportTemplate?.logoUrlRight || '',
  };

  // Apply theme from config
  THEME = buildTheme(cfg);
  IS_RTL = cfg.language !== 'en';

  // Translation helper: returns text based on language setting
  const t = (ar: string, en: string, bilingual?: string): string => {
    if (cfg.language === 'en') return en;
    if (cfg.language === 'ar') return ar;
    return bilingual !== undefined ? bilingual : `${ar} - ${en}`;
  };

  const pptx = new PptxGenJS();
  pptx.author = 'EPM - Enterprise Project Management';
  pptx.company = cfg.companyName || 'EPM';
  pptx.title = 'Project Status Report';
  pptx.subject = 'Project Weekly Status Report';
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5

  // Define all 5 master layouts — must happen before any addSlide() calls
  defineMasterLayouts(pptx, cfg);
  const createSlide = (layout: MasterLayoutName = 'MASTER_TITLE_AND_CONTENT') =>
    pptx.addSlide({ masterName: layout });

  // Map a slide key + template slideLayouts config → MasterLayoutName
  const masterForSlide = (slideKey: string): MasterLayoutName => {
    const layoutKey = (cfg as any).slideLayouts?.[slideKey] as string | undefined;
    const map: Record<string, MasterLayoutName> = {
      cover:           'MASTER_COVER',
      blank:           'MASTER_BLANK',
      contentEmpty:    'MASTER_CONTENT_EMPTY',
      titleAndContent: 'MASTER_TITLE_AND_CONTENT',
      sectionTitle:    'MASTER_SECTION_TITLE',
    };
    return map[layoutKey ?? ''] ?? 'MASTER_TITLE_AND_CONTENT';
  };

  // Per-slide background images disabled — master layout backgrounds are used instead
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addSlideBg = (_slide: any, _slideKey: string) => { /* no-op */ };

  // ————— Date ranges —————
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const nextMonday = new Date(sunday);
  nextMonday.setDate(sunday.getDate() + 1);
  nextMonday.setHours(0, 0, 0, 0);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999);

  // ————— Fetch Data —————
  console.log('[PPT Generator] Fetching project data...');
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: { select: { firstName: true, lastName: true } },
      members: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!project) throw new Error('Project not found');
  console.log('[PPT Generator] Project found:', project.name);

  // All tasks (only parent/milestone-level tasks for milestones section)
  const allTasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignedTo: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startDate: 'asc' },
  }) as any[];

  // Milestones = mid-level summary tasks (have children AND have a parent themselves)
  // Excludes top-level phase containers (parentId === null) and leaf-level work tasks
  const parentTaskIds = new Set(
    allTasks.filter(t => t.parentId).map(t => t.parentId!)
  );
  const milestones = allTasks.filter(t => parentTaskIds.has(t.id) && t.parentId !== null);

  // Completed tasks this week
  const completedThisWeek = allTasks.filter(
    t => t.status === 'COMPLETED' && t.updatedAt >= monday && t.updatedAt <= sunday
  );

  // Planned tasks next week
  const plannedNextWeek = allTasks.filter(
    t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' &&
      t.startDate <= nextSunday && t.endDate >= nextMonday
  );

  // RAID items
  const raidItems = await prisma.rAIDItem.findMany({
    where: { projectId },
    include: {
      owner: { select: { firstName: true, lastName: true } },
      mitigationOwner: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ type: 'asc' }, { riskScore: 'desc' }],
  });

  // Statistics
  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressCount = allTasks.filter(t => t.status === 'IN_PROGRESS').length;

  // Calculated progress metrics
  const actualProgress = totalTasks > 0
    ? allTasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks
    : 0;

  // Planned progress: based on timeline (how many days have elapsed vs total duration)
  const projectStart = new Date(project.startDate).getTime();
  const projectEnd = new Date(project.endDate).getTime();
  const totalDuration = projectEnd - projectStart;
  const elapsed = Math.min(today.getTime() - projectStart, totalDuration);
  const plannedProgress = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;

  const overdueTasks = allTasks.filter(
    t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.endDate) < today
  ).length;

  // ============================================================
  //  SLIDE 1: TITLE PAGE
  // ============================================================
  if (cfg.slides.titlePage) {
    const slide1 = createSlide(masterForSlide('titlePage'));
    addSlideBg(slide1, 'titlePage');

    // Project name — right panel (RTL) or left panel (LTR)
    const coverPanelX = IS_RTL ? 7.3 : 0.3;
    const coverAlign = IS_RTL ? 'right' : 'left';
    const dateLocale = cfg.language === 'en' ? 'en-US' : 'ar-SA';
    slide1.addText(project.name, {
      x: coverPanelX, y: 2.8, w: 5.7, h: 1.4,
      fontSize: 32, bold: true, color: THEME.white, align: coverAlign,
      fontFace: 'Segoe UI', rtlMode: IS_RTL,
    });

    // Report date
    slide1.addText(
      today.toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' }),
      {
        x: coverPanelX, y: 4.3, w: 5.7, h: 0.6,
        fontSize: 20, bold: true, color: THEME.white, align: coverAlign,
        fontFace: 'Segoe UI', rtlMode: IS_RTL,
      }
    );

  } // end titlePage

  // ============================================================
  //  SLIDE 2: AGENDA (جدول الأعمال)
  // ============================================================
  if (cfg.slides.agenda) {
    const slide2 = createSlide(masterForSlide('agenda'));
    addSlideBg(slide2, 'agenda');
    addSlideHeader(slide2, (cfg as any).slideTitles?.agenda || t('جدول الأعمال', 'Agenda', 'جدول الأعمال - Agenda'));

  const agendaItems = [
    { num: '01', arTitle: 'ملخص تنفيذي',          enTitle: 'Executive Summary' },
    { num: '02', arTitle: 'خط سير المشروع والمهام', enTitle: 'Project Progress & Tasks' },
    { num: '03', arTitle: 'المخاطر / التحديات',    enTitle: 'Risks & Challenges' },
  ];

  const agendaNumX  = IS_RTL ? 10.8 : 1.5;
  const agendaTxtX  = IS_RTL ? 1.5  : 2.8;
  const agendaTxtW  = 9.0;
  const agendaTxtAlign = IS_RTL ? 'right' : 'left';
  let agendaY = 1.8;
  agendaItems.forEach((item) => {
    // Number circle
    slide2.addShape('ellipse' as any, {
      x: agendaNumX, y: agendaY - 0.1, w: 0.9, h: 0.9,
      fill: { color: THEME.primary },
    });
    slide2.addText(item.num, {
      x: agendaNumX, y: agendaY, w: 0.9, h: 0.7,
      fontSize: 22, bold: true, color: THEME.white, align: 'center', valign: 'middle',
    });

    // Main title
    slide2.addText(t(item.arTitle, item.enTitle), {
      x: agendaTxtX, y: agendaY - 0.05, w: agendaTxtW, h: 0.5,
      fontSize: 22, bold: true, color: THEME.dark,
      fontFace: 'Segoe UI', align: agendaTxtAlign, rtlMode: IS_RTL,
    });

    // English subtitle (bilingual mode only)
    if (cfg.language === 'bilingual') {
      slide2.addText(item.enTitle, {
        x: agendaTxtX, y: agendaY + 0.45, w: agendaTxtW, h: 0.35,
        fontSize: 14, color: THEME.lightText,
        fontFace: 'Segoe UI', align: agendaTxtAlign,
      });
    }

    agendaY += 2.0;
  });

  } // end agenda

  // ============================================================
  //  SECTION DIVIDER 01: ملخص تنفيذي
  // ============================================================
  if (cfg.slides.executiveSummary) {
    const secSlide1 = createSlide('MASTER_SECTION_TITLE');
    secSlide1.addText('01', {
      x: IS_RTL ? 0.3 : 9.0, y: 3.5, w: 4.0, h: 2.5,
      fontSize: 120, bold: true, color: THEME.white, align: IS_RTL ? 'left' : 'right', valign: 'bottom',
      fontFace: 'Segoe UI', transparency: 20,
    });
    secSlide1.addText(t('ملخص تنفيذي', 'Executive Summary'), {
      x: IS_RTL ? 5.5 : 0.3, y: 2.5, w: 7.5, h: 1.2,
      fontSize: 44, bold: true, color: THEME.white, align: IS_RTL ? 'right' : 'left', valign: 'middle',
      fontFace: 'Segoe UI', rtlMode: IS_RTL,
    });
    if (cfg.language === 'bilingual') {
      secSlide1.addText('Executive Summary', {
        x: 5.5, y: 3.7, w: 7.5, h: 0.7,
        fontSize: 22, color: THEME.accent, align: 'right', valign: 'middle',
        fontFace: 'Segoe UI',
      });
    }
  }

  // ============================================================
  //  SLIDE 3: EXECUTIVE SUMMARY (ملخص تنفيذي)
  // ============================================================
  if (cfg.slides.executiveSummary) {
    const slide3 = createSlide(masterForSlide('executiveSummary'));
    addSlideBg(slide3, 'executiveSummary');
    addSlideHeader(slide3, (cfg as any).slideTitles?.executiveSummary || t('ملخص تنفيذي', 'Executive Summary', 'ملخص تنفيذي - Executive Summary'));

  // Progress cards row
  const cards = [
    { label: t('الإنجاز الفعلي', 'Actual Progress', 'الإنجاز الفعلي\nActual Progress'), value: `${actualProgress.toFixed(1)}%`, color: THEME.success },
    { label: t('الإنجاز المخطط', 'Planned Progress', 'الإنجاز المخطط\nPlanned Progress'), value: `${plannedProgress.toFixed(1)}%`, color: THEME.info },
    { label: t('التباين', 'Variance', 'التباين\nVariance'), value: varianceIndicator(plannedProgress, actualProgress), color: varianceColor(plannedProgress, actualProgress) },
    { label: t('حالة المشروع', 'Project Status', 'حالة المشروع\nProject Status'), value: project.status.replace('_', ' '), color: THEME.secondary },
  ];

  cards.forEach((card, i) => {
    const cx = 0.5 + i * 3.15;
    // Card background
    slide3.addShape('roundRect' as any, {
      x: cx, y: 1.2, w: 2.9, h: 1.8,
      fill: { color: THEME.cardBg },
      shadow: { type: 'outer', blur: 6, offset: 2, color: '00000020' },
      rectRadius: 0.1,
    });
    // Card value
    slide3.addText(card.value, {
      x: cx, y: 1.35, w: 2.9, h: 0.9,
      fontSize: 28, bold: true, color: card.color, align: 'center', valign: 'middle',
    });
    // Card label
    slide3.addText(card.label, {
      x: cx, y: 2.2, w: 2.9, h: 0.7,
      fontSize: 10, color: THEME.text, align: 'center', valign: 'middle',
    });
  });

  // Summary statistics row
  const stats2 = [
    { label: t('إجمالي المهام', 'Total Tasks', 'إجمالي المهام\nTotal Tasks'), value: totalTasks.toString(), color: THEME.primary },
    { label: t('مكتملة', 'Completed', 'مكتملة\nCompleted'), value: completedCount.toString(), color: THEME.success },
    { label: t('قيد التنفيذ', 'In Progress', 'قيد التنفيذ\nIn Progress'), value: inProgressCount.toString(), color: THEME.info },
    { label: t('متأخرة', 'Overdue', 'متأخرة\nOverdue'), value: overdueTasks.toString(), color: THEME.danger },
  ];

  stats2.forEach((stat, i) => {
    const cx = 0.5 + i * 3.15;
    slide3.addShape('roundRect' as any, {
      x: cx, y: 3.4, w: 2.9, h: 1.4,
      fill: { color: THEME.white },
      shadow: { type: 'outer', blur: 4, offset: 1, color: '00000015' },
      rectRadius: 0.1,
    });
    slide3.addText(stat.value, {
      x: cx, y: 3.5, w: 2.9, h: 0.7,
      fontSize: 30, bold: true, color: stat.color, align: 'center',
    });
    slide3.addText(stat.label, {
      x: cx, y: 4.15, w: 2.9, h: 0.55,
      fontSize: 9, color: THEME.text, align: 'center',
    });
  });

  // Project timeline bar
  slide3.addText(t('مدة المشروع', 'Project Duration', 'مدة المشروع / Project Duration'), {
    x: 0.5, y: 5.2, w: 12, h: 0.3,
    fontSize: 12, bold: true, color: THEME.dark,
  });

  slide3.addText(
    `${fmtDate(project.startDate)}  —  ${fmtDate(project.endDate)}`,
    {
      x: 0.5, y: 5.5, w: 12, h: 0.3,
      fontSize: 11, color: THEME.text,
    }
  );

  // Progress bar background
  slide3.addShape('roundRect' as any, {
    x: 0.5, y: 5.9, w: 12, h: 0.35,
    fill: { color: 'E2E8F0' },
    rectRadius: 0.05,
  });

  // Progress bar fill
  const progressWidth = Math.max(0.1, (actualProgress / 100) * 12);
  slide3.addShape('roundRect' as any, {
    x: 0.5, y: 5.9, w: progressWidth, h: 0.35,
    fill: { color: THEME.success },
    rectRadius: 0.05,
  });

  slide3.addText(`${actualProgress.toFixed(1)}%`, {
    x: 0.5, y: 5.9, w: 12, h: 0.35,
    fontSize: 10, bold: true, color: THEME.white, align: 'center', valign: 'middle',
  });

  } // end executiveSummary

  // ============================================================
  //  SLIDE 3b: WEEKLY HIGHLIGHTS (completed + planned — two columns)
  //  Data from WeeklyHighlight table, matched to this report's week
  // ============================================================
  if ((cfg.slides as any).weeklyHighlights) {
    const weekHighlights = await prisma.weeklyHighlight.findMany({
      where: {
        projectId,
        weekDate: { gte: monday, lte: sunday },
      },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });

    const completedHL = weekHighlights.filter(h => h.type === 'COMPLETED');
    const plannedHL   = weekHighlights.filter(h => h.type === 'PLANNED');

    const slideHL = createSlide(masterForSlide('weeklyHighlights'));
    addSlideBg(slideHL, 'weeklyHighlights');
    addSlideHeader(slideHL, (cfg as any).slideTitles?.weeklyHighlights || t('ملخص الأسبوع', 'Weekly Highlights', 'ملخص الأسبوع - Weekly Highlights'));

    // Layout: two columns + right-side progress doughnut area (matching screenshot)
    const LEFT_X   = IS_RTL ? 6.8 : 0.2;   // "this week" column
    const RIGHT_X  = IS_RTL ? 0.2 : 6.8;   // "next week" column
    const COL_W    = 6.3;
    const COL_Y    = 1.0;
    const COL_H    = 5.6;
    const CHART_X  = IS_RTL ? 0.2 : 10.1;  // donut charts area (slim right strip when LTR, left when RTL — override below)
    const CHART_COL_X = IS_RTL ? 0.2 : 10.1;
    const CHART_COL_W = 2.8;

    // --- Column headers ---
    const completedTitle = t('ما تم إنجازه في الفترة السابقة (أسبوعي)', 'Completed This Week', 'ما تم إنجازه في الفترة السابقة (أسبوعي)');
    const plannedTitle   = t('المهام المخطط إنجازها في الفترة القادمة (أسبوعي)', 'Planned Next Week', 'المهام المخطط إنجازها في الفترة القادمة (أسبوعي)');

    // Column header background
    slideHL.addShape('rect' as any, {
      x: LEFT_X, y: COL_Y, w: COL_W, h: 0.4,
      fill: { color: THEME.secondary },
    });
    slideHL.addText(completedTitle, {
      x: LEFT_X, y: COL_Y, w: COL_W, h: 0.4,
      fontSize: 11, bold: true, color: THEME.white,
      align: IS_RTL ? 'center' : 'center', valign: 'middle', rtlMode: IS_RTL,
    });

    slideHL.addShape('rect' as any, {
      x: RIGHT_X, y: COL_Y, w: COL_W, h: 0.4,
      fill: { color: THEME.primary },
    });
    slideHL.addText(plannedTitle, {
      x: RIGHT_X, y: COL_Y, w: COL_W, h: 0.4,
      fontSize: 11, bold: true, color: THEME.white,
      align: 'center', valign: 'middle', rtlMode: IS_RTL,
    });

    // --- Bullet items ---
    const ITEM_Y_START = COL_Y + 0.48;
    const ITEM_H       = 0.42;
    const BULLET       = IS_RTL ? '•' : '•';

    const renderItems = (items: { description: string }[], colX: number, colW: number) => {
      if (items.length === 0) {
        slideHL.addText(t('لا توجد بيانات', 'No data', 'لا توجد بيانات / No data'), {
          x: colX + 0.1, y: ITEM_Y_START, w: colW - 0.2, h: 0.4,
          fontSize: 10, italic: true, color: THEME.lightText,
          align: IS_RTL ? 'right' : 'left', rtlMode: IS_RTL,
        });
        return;
      }
      items.forEach((item, idx) => {
        const y = ITEM_Y_START + idx * ITEM_H;
        if (y + ITEM_H > COL_Y + COL_H) return; // overflow guard
        const rowFill = idx % 2 !== 0 ? 'F8FAFC' : 'FFFFFF';
        slideHL.addShape('rect' as any, {
          x: colX, y, w: colW, h: ITEM_H - 0.04,
          fill: { color: rowFill },
        });
        slideHL.addText(`${BULLET}  ${item.description}`, {
          x: colX + 0.15, y, w: colW - 0.2, h: ITEM_H - 0.04,
          fontSize: 10, color: THEME.text,
          align: IS_RTL ? 'right' : 'left', valign: 'middle', rtlMode: IS_RTL, wrap: true,
        });
      });
    };

    renderItems(completedHL, LEFT_X, COL_W);
    renderItems(plannedHL, RIGHT_X, COL_W);

    // --- Right-side progress metrics (doughnut-style stat cards) ---
    const statCardX = CHART_COL_X;
    const statCardW = CHART_COL_W;

    // Actual progress card
    slideHL.addShape('roundRect' as any, {
      x: statCardX, y: 1.0, w: statCardW, h: 2.0,
      fill: { color: THEME.cardBg },
      shadow: { type: 'outer', blur: 5, offset: 2, color: '00000018' },
      rectRadius: 0.1,
    });
    slideHL.addText(`${actualProgress.toFixed(1)}%`, {
      x: statCardX, y: 1.1, w: statCardW, h: 0.9,
      fontSize: 32, bold: true, color: THEME.success, align: 'center',
    });
    slideHL.addText(t('نسبة الإنجاز\nالفعلية', 'Actual\nProgress', 'نسبة الإنجاز\nالفعلية'), {
      x: statCardX, y: 2.0, w: statCardW, h: 0.9,
      fontSize: 10, color: THEME.text, align: 'center', rtlMode: IS_RTL,
    });

    // Planned progress card
    slideHL.addShape('roundRect' as any, {
      x: statCardX, y: 3.15, w: statCardW, h: 2.0,
      fill: { color: THEME.cardBg },
      shadow: { type: 'outer', blur: 5, offset: 2, color: '00000018' },
      rectRadius: 0.1,
    });
    slideHL.addText(`${plannedProgress.toFixed(1)}%`, {
      x: statCardX, y: 3.25, w: statCardW, h: 0.9,
      fontSize: 32, bold: true, color: THEME.info, align: 'center',
    });
    slideHL.addText(t('نسبة الإنجاز\nالمخططة', 'Planned\nProgress', 'نسبة الإنجاز\nالمخططة'), {
      x: statCardX, y: 4.15, w: statCardW, h: 0.9,
      fontSize: 10, color: THEME.text, align: 'center', rtlMode: IS_RTL,
    });

    // Variance badge
    const varVal = Math.abs(plannedProgress - actualProgress).toFixed(1);
    const varColor = plannedProgress > actualProgress + 5 ? THEME.danger : plannedProgress > actualProgress ? THEME.warning : THEME.success;
    slideHL.addShape('roundRect' as any, {
      x: statCardX, y: 5.3, w: statCardW, h: 0.8,
      fill: { color: varColor }, rectRadius: 0.08,
    });
    slideHL.addText(`${t('مؤشر التباين', 'Variance', 'مؤشر التباين')}\n${varVal}%`, {
      x: statCardX, y: 5.3, w: statCardW, h: 0.8,
      fontSize: 11, bold: true, color: THEME.white, align: 'center', valign: 'middle',
    });

    // Legend at bottom
    const legendY = 6.6;
    const legendItems = [
      { label: t('على المسار', 'On Track', 'On Track'), color: THEME.success },
      { label: t('مخاطر محتملة', 'At Risk', 'At Risk'), color: THEME.warning },
      { label: t('متأخر', 'Delayed', 'Delayed'), color: THEME.danger },
    ];
    legendItems.forEach((item, i) => {
      const lx = 1.0 + i * 3.8;
      slideHL.addShape('rect' as any, { x: lx, y: legendY, w: 0.25, h: 0.18, fill: { color: item.color } });
      slideHL.addText(item.label, { x: lx + 0.3, y: legendY, w: 3.0, h: 0.18, fontSize: 9, color: THEME.text });
    });

  } // end weeklyHighlights

  // ============================================================
  //  MILESTONES after Executive Summary (Section 01)
  // ============================================================
  if (cfg.slides.milestones) {
    const MILESTONES_PER_PAGE = cfg.milestonesPerPage || 14;
    const milestonePages = Math.max(1, Math.ceil(milestones.length / MILESTONES_PER_PAGE));

    for (let page = 0; page < milestonePages; page++) {
      const slideM = createSlide(masterForSlide('milestones'));
      addSlideBg(slideM, 'milestones');
      const pageLabel = milestonePages > 1 ? ` (${page + 1}/${milestonePages})` : '';
      addSlideHeader(slideM, ((cfg as any).slideTitles?.milestones || t('المعالم الرئيسية', 'Key Milestones', 'المعالم الرئيسية - Key Milestones')) + pageLabel);

      const milestonesOnPage = milestones.slice(
        page * MILESTONES_PER_PAGE,
        (page + 1) * MILESTONES_PER_PAGE
      );

      if (milestonesOnPage.length === 0 && page === 0) {
        slideM.addText(t('لا توجد معالم رئيسية', 'No milestones defined', 'لا توجد معالم رئيسية / No milestones defined'), {
          x: 1, y: 3, w: 11, h: 1,
          fontSize: 16, color: THEME.lightText, italic: true, align: 'center',
        });
      } else {
        // RTL column order: التباين | الانتهاء الفعلي | الانتهاء المخطط | البدء المخطط | الحالة | المعلم | #
        const statusColors: Record<string, string> = {
          COMPLETED: THEME.success, IN_PROGRESS: THEME.info,
          NOT_STARTED: THEME.lightText, DELAYED: THEME.danger, ON_HOLD: THEME.warning,
        };
        const statusLabels: Record<string, string> = IS_RTL ? {
          COMPLETED: 'تم الانتهاء', IN_PROGRESS: 'قيد التنفيذ',
          NOT_STARTED: 'لم تبدأ', DELAYED: 'متأخر', ON_HOLD: 'متوقف',
        } : {
          COMPLETED: 'Completed', IN_PROGRESS: 'In Progress',
          NOT_STARTED: 'Not Started', DELAYED: 'Delayed', ON_HOLD: 'On Hold',
        };

        // RTL: تباين | انتهاء فعلي | انتهاء مخطط | بداية مخطط | حالة | المعلم | #
        // LTR: # | Milestone | Status | Planned Start | Planned End | Actual End | Variance
        const msHeaderRow = IS_RTL ? [
          headerCell(t('التباين (أيام)', 'Variance (Days)')),
          headerCell(t('الانتهاء الفعلي', 'Actual Finish')),
          headerCell(t('البدء الفعلي', 'Actual Start')),
          headerCell(t('الانتهاء الأساسي', 'Baseline Finish')),
          headerCell(t('البدء الأساسي', 'Baseline Start')),
          headerCell(t('تاريخ الانتهاء', 'Planned End')),
          headerCell(t('تاريخ البدء', 'Planned Start')),
          headerCell(t('الحالة', 'Status')),
          headerCell(t('المعلم', 'Milestone')),
          headerCell('#'),
        ] : [
          headerCell('#'),
          headerCell('Milestone'),
          headerCell('Status'),
          headerCell('Planned Start'),
          headerCell('Planned End'),
          headerCell('Baseline Start'),
          headerCell('Baseline Finish'),
          headerCell('Actual Start'),
          headerCell('Actual Finish'),
          headerCell('Variance (Days)'),
        ];

        const msRows: any[][] = [msHeaderRow];
        milestonesOnPage.forEach((m: any, idx: number) => {
          const rowFill = idx % 2 === 0 ? {} : { fill: { color: THEME.tableAltRow } };
          const statusClr = statusColors[m.status] || THEME.text;
          const plannedEnd = m.endDate ? new Date(m.endDate) : null;
          const actualEnd = (m.actualFinish ?? m.actualEndDate) ? new Date(m.actualFinish ?? m.actualEndDate) : null;
          let variance = '-';
          if (plannedEnd && actualEnd) {
            const diff = Math.round((actualEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24));
            variance = IS_RTL
              ? (diff > 0 ? `+${diff} يوم` : diff < 0 ? `${diff} يوم` : '0 يوم')
              : (diff > 0 ? `+${diff}d` : diff < 0 ? `${diff}d` : '0d');
          }
          const varCell  = dataCell(variance, { color: variance.startsWith('+') ? THEME.danger : THEME.success, bold: true, ...rowFill });
          const numCell  = dataCell((page * MILESTONES_PER_PAGE + idx + 1).toString(), rowFill);
          const nameCell = dataCell(m.name, { align: IS_RTL ? 'right' : 'left', rtlMode: IS_RTL, ...rowFill });
          const stCell   = dataCell(statusLabels[m.status] || m.status, { color: statusClr, bold: true, ...rowFill });
          const startCell     = dataCell(fmtDate(m.startDate), rowFill);
          const endCell       = dataCell(fmtDate(m.endDate), rowFill);
          const baseStartCell = dataCell(fmtDate(m.baselineStart), rowFill);
          const baseEndCell   = dataCell(fmtDate(m.baselineFinish), rowFill);
          const actStartCell  = dataCell(fmtDate(m.actualStart), rowFill);
          const actEndCell    = dataCell(fmtDate(m.actualFinish ?? m.actualEndDate), rowFill);
          msRows.push(IS_RTL
            ? [varCell, actEndCell, actStartCell, baseEndCell, baseStartCell, endCell, startCell, stCell, nameCell, numCell]
            : [numCell, nameCell, stCell, startCell, endCell, baseStartCell, baseEndCell, actStartCell, actEndCell, varCell]
          );
        });
        slideM.addTable(msRows, {
          x: 0.15, y: 1.0, w: 13.0,
          colW: IS_RTL ? [1.3, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.1, 3.0, 0.4] : [0.4, 3.0, 1.1, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.3],
          rowH: 0.32,
          border: { pt: 0.5, color: THEME.tableBorder },
        });
      }
    }
  } // end milestones (section 01)

  // ============================================================
  //  SECTION DIVIDER 02: خط سير المشروع والمهام
  // ============================================================
  if (cfg.slides.weeklyProgress || (cfg.slides as any).nextWeek) {
    const secSlide2 = createSlide('MASTER_SECTION_TITLE');
    secSlide2.addText('02', {
      x: IS_RTL ? 0.3 : 9.0, y: 3.5, w: 4.0, h: 2.5,
      fontSize: 120, bold: true, color: THEME.white, align: IS_RTL ? 'left' : 'right', valign: 'bottom',
      fontFace: 'Segoe UI', transparency: 20,
    });
    secSlide2.addText(t('خط سير المشروع والمهام', 'Project Progress & Tasks'), {
      x: IS_RTL ? 4.0 : 0.3, y: 2.5, w: 9.0, h: 1.2,
      fontSize: 38, bold: true, color: THEME.white, align: IS_RTL ? 'right' : 'left', valign: 'middle',
      fontFace: 'Segoe UI', rtlMode: IS_RTL,
    });
    if (cfg.language === 'bilingual') {
      secSlide2.addText('Project Progress & Tasks', {
        x: 4.0, y: 3.7, w: 9.0, h: 0.7,
        fontSize: 22, color: THEME.accent, align: 'right', valign: 'middle',
        fontFace: 'Segoe UI',
      });
    }
  }

  // ============================================================
  //  SLIDE 4: THIS WEEK (ما تم إنجازه هذا الأسبوع)
  // ============================================================
  if (cfg.slides.weeklyProgress) {
    const slide4 = createSlide(masterForSlide('weeklyProgress'));
    addSlideBg(slide4, 'weeklyProgress');
    addSlideHeader(slide4, (cfg as any).slideTitles?.weeklyProgress || t('ما تم إنجازه هذا الأسبوع', 'This Week Achievements', 'ما تم إنجازه هذا الأسبوع - This Week Achievements'));

  if (completedThisWeek.length === 0) {
    slide4.addText(t('لا توجد مهام مكتملة هذا الأسبوع', 'No tasks completed this week', 'لا توجد مهام مكتملة هذا الأسبوع / No tasks completed this week'), {
      x: 0.5, y: 2.5, w: 12, h: 1,
      fontSize: 16, color: THEME.lightText, italic: true, align: 'center',
    });
  } else {
    // RTL: تاريخ الإنجاز | المسؤول | المهمة | #
    // LTR: # | Task | Assignee | Completion Date
    const tw4Header = IS_RTL
      ? [headerCell(t('تاريخ الإنجاز', 'Completion Date')), headerCell(t('المسؤول', 'Assignee')), headerCell(t('المهمة', 'Task')), headerCell('#')]
      : [headerCell('#'), headerCell('Task'), headerCell('Assignee'), headerCell('Completion Date')];
    const rows4: any[][] = [tw4Header];

    let rowNum4 = 1;
    completedThisWeek.slice(0, cfg.thisWeekPerPage || 20).forEach((task) => {
        const assignee = task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '-';
        const rowFill = rowNum4 % 2 === 0 ? {} : { fill: { color: THEME.tableAltRow } };
        const numCell4   = dataCell(rowNum4.toString(), rowFill);
        const nameCell4  = dataCell(task.name, { align: IS_RTL ? 'right' : 'left', rtlMode: IS_RTL, ...rowFill });
        const asnCell4   = dataCell(assignee, rowFill);
        const dateCell4  = dataCell(fmtDate(task.updatedAt), rowFill);
        rows4.push(IS_RTL
          ? [dateCell4, asnCell4, nameCell4, numCell4]
          : [numCell4, nameCell4, asnCell4, dateCell4]
        );
        rowNum4++;
    });

    slide4.addTable(rows4, {
      x: 0.3, y: 1.0, w: 12.7,
      colW: IS_RTL ? [2.4, 3.5, 6.3, 0.5] : [0.5, 6.3, 3.5, 2.4],
      rowH: 0.32,
      border: { pt: 0.5, color: THEME.tableBorder },
    });
  }

  // Progress bar at bottom
  const bY4 = 6.5;
  slide4.addShape('roundRect' as any, { x: 0.5, y: bY4, w: 12, h: 0.3, fill: { color: 'E2E8F0' }, rectRadius: 0.05 });
  slide4.addShape('roundRect' as any, {
    x: 0.5, y: bY4, w: Math.max(0.05, (actualProgress / 100) * 12), h: 0.3,
    fill: { color: THEME.success }, rectRadius: 0.05,
  });
  slide4.addText(t(`الإنجاز الفعلي ${actualProgress.toFixed(1)}%`, `Actual Progress ${actualProgress.toFixed(1)}%`, `الإنجاز الفعلي ${actualProgress.toFixed(1)}% / Actual Progress`), {
    x: 0.5, y: bY4, w: 12, h: 0.3, fontSize: 9, bold: true, color: THEME.white, align: 'center', valign: 'middle',
  });

  } // end weeklyProgress

  // ============================================================
  //  SLIDE 5: NEXT WEEK PLAN (خطة الأسبوع القادم)
  // ============================================================
  if ((cfg.slides as any).nextWeek) {
    const slide5 = createSlide(masterForSlide('nextWeek'));
    addSlideBg(slide5, 'nextWeek');
    addSlideHeader(slide5, (cfg as any).slideTitles?.nextWeek || t('خطة الأسبوع القادم', 'Next Week Plan', 'خطة الأسبوع القادم - Next Week Plan'));

  if (plannedNextWeek.length === 0) {
    slide5.addText(t('لا توجد مهام مخططة للأسبوع القادم', 'No tasks planned for next week', 'لا توجد مهام مخططة للأسبوع القادم / No tasks planned for next week'), {
      x: 0.5, y: 2.5, w: 12, h: 1,
      fontSize: 16, color: THEME.lightText, italic: true, align: 'center',
    });
  } else {
    // RTL: الموعد النهائي | تاريخ البدء | المسؤول | المهمة | #
    // LTR: # | Task | Assignee | Start Date | Due Date
    const tw5Header = IS_RTL
      ? [headerCell(t('الموعد النهائي', 'Due Date')), headerCell(t('تاريخ البدء', 'Start Date')), headerCell(t('المسؤول', 'Assignee')), headerCell(t('المهمة', 'Task')), headerCell('#')]
      : [headerCell('#'), headerCell('Task'), headerCell('Assignee'), headerCell('Start Date'), headerCell('Due Date')];
    const rows5: any[][] = [tw5Header];
    plannedNextWeek.slice(0, cfg.nextWeekPerPage || 18).forEach((task, idx) => {
      const assignee = task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '-';
      const rowFill = idx % 2 === 0 ? {} : { fill: { color: THEME.tableAltRow } };
      const numCell5   = dataCell((idx + 1).toString(), rowFill);
      const nameCell5  = dataCell(task.name, { align: IS_RTL ? 'right' : 'left', rtlMode: IS_RTL, ...rowFill });
      const asnCell5   = dataCell(assignee, rowFill);
      const startCell5 = dataCell(fmtDate(task.startDate), rowFill);
      const dueCell5   = dataCell(fmtDate(task.endDate), rowFill);
      rows5.push(IS_RTL
        ? [dueCell5, startCell5, asnCell5, nameCell5, numCell5]
        : [numCell5, nameCell5, asnCell5, startCell5, dueCell5]
      );
    });

    slide5.addTable(rows5, {
      x: 0.3, y: 1.0, w: 12.7,
      colW: IS_RTL ? [1.7, 1.7, 3.0, 5.8, 0.5] : [0.5, 5.8, 3.0, 1.7, 1.7],
      rowH: 0.32,
      border: { pt: 0.5, color: THEME.tableBorder },
    });
  }

  // Planned progress bar at bottom
  const bY5 = 6.5;
  slide5.addShape('roundRect' as any, { x: 0.5, y: bY5, w: 12, h: 0.3, fill: { color: 'E2E8F0' }, rectRadius: 0.05 });
  slide5.addShape('roundRect' as any, {
    x: 0.5, y: bY5, w: Math.max(0.05, (plannedProgress / 100) * 12), h: 0.3,
    fill: { color: THEME.info }, rectRadius: 0.05,
  });
  slide5.addText(t(`الإنجاز المخطط ${plannedProgress.toFixed(1)}%`, `Planned Progress ${plannedProgress.toFixed(1)}%`, `الإنجاز المخطط ${plannedProgress.toFixed(1)}% / Planned Progress`), {
    x: 0.5, y: bY5, w: 12, h: 0.3, fontSize: 9, bold: true, color: THEME.white, align: 'center', valign: 'middle',
  });

  } // end nextWeek

  // ============================================================
  //  SECTION DIVIDER 03: المخاطر / التحديات
  // ============================================================
  if (cfg.slides.risksAndChallenges) {
    const secSlide3 = createSlide('MASTER_SECTION_TITLE');
    secSlide3.addText('03', {
      x: IS_RTL ? 0.3 : 9.0, y: 3.5, w: 4.0, h: 2.5,
      fontSize: 120, bold: true, color: THEME.white, align: IS_RTL ? 'left' : 'right', valign: 'bottom',
      fontFace: 'Segoe UI', transparency: 20,
    });
    secSlide3.addText(t('المخاطر / التحديات', 'Risks & Challenges'), {
      x: IS_RTL ? 5.0 : 0.3, y: 2.5, w: 8.0, h: 1.2,
      fontSize: 44, bold: true, color: THEME.white, align: IS_RTL ? 'right' : 'left', valign: 'middle',
      fontFace: 'Segoe UI', rtlMode: IS_RTL,
    });
    if (cfg.language === 'bilingual') {
      secSlide3.addText('Risks & Challenges', {
        x: 5.0, y: 3.7, w: 8.0, h: 0.7,
        fontSize: 22, color: THEME.accent, align: 'right', valign: 'middle',
        fontFace: 'Segoe UI',
      });
    }
  }

  // NOTE: Milestones block moved to after Executive Summary (Section 01)
  // The old SLIDE 6 block is removed to avoid duplication
  if (false) {
    const MILESTONES_PER_PAGE = cfg.milestonesPerPage || 10;
    const milestonePages = Math.max(1, Math.ceil(milestones.length / MILESTONES_PER_PAGE));

    for (let page = 0; page < milestonePages; page++) {
      const slideM = createSlide(masterForSlide('milestones'));
      addSlideBg(slideM, 'milestones');
      const pageLabel = milestonePages > 1 ? ` (${page + 1}/${milestonePages})` : '';
      addSlideHeader(slideM, `المعالم الرئيسية - Key Milestones${pageLabel}`);

    const milestonesOnPage = milestones.slice(
      page * MILESTONES_PER_PAGE,
      (page + 1) * MILESTONES_PER_PAGE
    );

    const msHeaders = [
      headerCell('#'),
      headerCell('الشرح\nDescription'),
      headerCell('الحالة\nStatus'),
      headerCell('البدء المخطط\nPlanned Start'),
      headerCell('الانتهاء المخطط\nPlanned End'),
      headerCell('البدء الفعلي\nActual Start'),
      headerCell('الانتهاء الفعلي\nActual End'),
      headerCell('% المخطط\nPlanned %'),
      headerCell('% الفعلي\nActual %'),
      headerCell('التباين\nVariance'),
      headerCell('ملاحظات\nNotes'),
    ];

    const msRows: any[][] = [msHeaders];

    milestonesOnPage.forEach((task, idx) => {
      const globalIdx = page * MILESTONES_PER_PAGE + idx + 1;
      const rowFill = idx % 2 === 0 ? {} : { fill: { color: THEME.tableAltRow } };

      // Calculate planned % for this task based on timeline
      const taskStart = new Date(task.startDate).getTime();
      const taskEnd = new Date(task.endDate).getTime();
      const taskDuration = taskEnd - taskStart;
      const taskElapsed = Math.min(today.getTime() - taskStart, taskDuration);
      const taskPlannedPct = taskDuration > 0
        ? Math.max(0, Math.min(100, (taskElapsed / taskDuration) * 100))
        : 0;

      const vInd = varianceIndicator(taskPlannedPct, task.progress);
      const vCol = varianceColor(taskPlannedPct, task.progress);

      // Determine actual dates: if completed, use updatedAt as actual end
      const actualStart = task.status !== 'NOT_STARTED' ? fmtDate(task.startDate) : '-';
      const actualEnd = task.status === 'COMPLETED' ? fmtDate(task.updatedAt) : '-';

      // Status display
      const statusText = task.status.replace('_', ' ');

      msRows.push([
        dataCell(globalIdx.toString(), rowFill),
        dataCell(task.name, { align: 'left', ...rowFill }),
        dataCell(statusText, { color: statusColor(task.status), bold: true, ...rowFill }),
        dataCell(fmtDate(task.startDate), rowFill),
        dataCell(fmtDate(task.endDate), rowFill),
        dataCell(actualStart, rowFill),
        dataCell(actualEnd, rowFill),
        dataCell(`${taskPlannedPct.toFixed(0)}%`, rowFill),
        dataCell(`${task.progress.toFixed(0)}%`, rowFill),
        dataCell(vInd, { color: vCol, bold: true, ...rowFill }),
        dataCell(task.description ? task.description.substring(0, 40) : '-', { align: 'left', fontSize: 7, ...rowFill }),
      ]);
    });

    slideM.addTable(msRows, {
      x: 0.2, y: 1.0, w: 12.9,
      colW: [0.4, 2.5, 1.0, 1.1, 1.1, 1.0, 1.0, 0.8, 0.8, 0.8, 2.4],
      rowH: 0.4,
      border: { pt: 0.5, color: THEME.tableBorder },
    });

    if (milestones.length === 0) {
      slideM.addText('لا توجد معالم رئيسية حالياً', {
        x: 1, y: 3, w: 11, h: 1,
        fontSize: 16, color: THEME.lightText, italic: true, align: 'center',
      });
    }
  }

  } // end milestones

  // ============================================================
  //  SLIDE 7: RISKS & CHALLENGES (المخاطر / التحديات)
  // ============================================================
  if (cfg.slides.risksAndChallenges) {
    const activeRisks = raidItems.filter(r => r.type === 'RISK' || r.type === 'ISSUE');
    const RISKS_PER_PAGE = cfg.risksPerPage || 8;
    const riskPages = Math.max(1, Math.ceil(activeRisks.length / RISKS_PER_PAGE));

    for (let page = 0; page < riskPages; page++) {
      const slideR = createSlide(masterForSlide('risksAndChallenges'));
      addSlideBg(slideR, 'risksAndChallenges');
      const pageLabel = riskPages > 1 ? ` (${page + 1}/${riskPages})` : '';
      addSlideHeader(slideR, ((cfg as any).slideTitles?.risksAndChallenges || t('المخاطر / التحديات', 'Risks & Challenges', 'المخاطر / التحديات - Risks & Challenges')) + pageLabel);

    const risksOnPage = activeRisks.slice(page * RISKS_PER_PAGE, (page + 1) * RISKS_PER_PAGE);

    // RTL: حالة | مسؤول | تاريخ إغلاق | خطة معالجة | تأثير | احتمال | فئة | نطاق | نوع | وصف
    // LTR: Description | Type | Scope | Priority | Probability | Impact | Mitigation | Target | Owner | Status
    const riskHeaderRow = IS_RTL ? [
      headerCell(t('الحالة', 'Status')),
      headerCell(t('المسؤول', 'Owner')),
      headerCell(t('تاريخ الإغلاق', 'Target Close')),
      headerCell(t('خطة المعالجة', 'Mitigation')),
      headerCell(t('التأثير', 'Impact')),
      headerCell(t('الاحتمالية', 'Probability')),
      headerCell(t('الفئة', 'Priority')),
      headerCell(t('النطاق', 'Scope')),
      headerCell(t('التصنيف', 'Type')),
      headerCell(t('وصف الخطر', 'Description')),
    ] : [
      headerCell('Description'),
      headerCell('Type'),
      headerCell('Scope'),
      headerCell('Priority'),
      headerCell('Probability'),
      headerCell('Impact'),
      headerCell('Mitigation'),
      headerCell('Target Close'),
      headerCell('Owner'),
      headerCell('Status'),
    ];

    const riskRows: any[][] = [riskHeaderRow];

    risksOnPage.forEach((item, idx) => {
      const rowFill = idx % 2 === 0 ? {} : { fill: { color: THEME.tableAltRow } };
      const ownerName = item.owner ? `${item.owner.firstName} ${item.owner.lastName}` : '-';

      const probMap: Record<string, string> = IS_RTL
        ? { VERY_LOW: 'منخفض جداً', LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'عالي', VERY_HIGH: 'عالي جداً' }
        : { VERY_LOW: 'Very Low', LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', VERY_HIGH: 'Very High' };
      const impactMap: Record<string, string> = IS_RTL
        ? { LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'عالي', VERY_HIGH: 'عالي جداً', CRITICAL: 'حرج' }
        : { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', VERY_HIGH: 'Very High', CRITICAL: 'Critical' };
      const statusMap: Record<string, string> = IS_RTL
        ? { OPEN: 'مفتوح', IN_PROGRESS: 'قيد المعالجة', MITIGATED: 'تم التخفيف', CLOSED: 'مغلق' }
        : { OPEN: 'Open', IN_PROGRESS: 'In Progress', MITIGATED: 'Mitigated', CLOSED: 'Closed' };

      const statusClr = item.status === 'CLOSED' ? THEME.success
        : item.status === 'MITIGATED' ? THEME.warning
        : item.status === 'OPEN' ? THEME.danger
        : THEME.info;

      const descCell   = dataCell(item.title, { align: IS_RTL ? 'right' : 'left', fontSize: 7, rtlMode: IS_RTL, ...rowFill });
      const typeCell   = dataCell(item.type === 'RISK' ? t('خطر', 'Risk', 'خطر / Risk') : t('تحدي', 'Issue', 'تحدي / Issue'), rowFill);
      const scopeCell  = dataCell(item.impactDescription ? item.impactDescription.substring(0, 20) : '-', { fontSize: 7, ...rowFill });
      const priCell    = dataCell(item.priority || '-', rowFill);
      const probCell   = dataCell(item.probability ? probMap[item.probability] || item.probability : '-', rowFill);
      const impCell    = dataCell(item.impact ? impactMap[item.impact] || item.impact : '-', rowFill);
      const mitiCell   = dataCell(item.mitigation ? item.mitigation.substring(0, 35) : '-', { align: IS_RTL ? 'right' : 'left', fontSize: 7, ...rowFill });
      const targetCell = dataCell(fmtDate(item.targetDate || item.revisedTargetDate), rowFill);
      const ownerCell  = dataCell(ownerName, rowFill);
      const statusCell = dataCell(statusMap[item.status] || item.status, { color: statusClr, bold: true, ...rowFill });

      riskRows.push(IS_RTL
        ? [statusCell, ownerCell, targetCell, mitiCell, impCell, probCell, priCell, scopeCell, typeCell, descCell]
        : [descCell, typeCell, scopeCell, priCell, probCell, impCell, mitiCell, targetCell, ownerCell, statusCell]
      );
    });

    slideR.addTable(riskRows, {
      x: 0.15, y: 1.0, w: 13.0,
      colW: IS_RTL ? [1.0, 1.3, 1.2, 2.2, 0.9, 1.0, 0.8, 1.0, 1.0, 2.2] : [2.2, 1.0, 1.0, 0.8, 1.0, 0.9, 2.2, 1.2, 1.3, 1.0],
      rowH: 0.42,
      border: { pt: 0.5, color: THEME.tableBorder },
    });

    if (activeRisks.length === 0) {
      slideR.addText(t('لا توجد مخاطر أو تحديات نشطة حالياً', 'No active risks or challenges', 'لا توجد مخاطر أو تحديات نشطة / No active risks'), {
        x: 1, y: 3, w: 11, h: 1,
        fontSize: 16, color: THEME.lightText, italic: true, align: 'center',
      });
    }
  }

  } // end risksAndChallenges

  // ============================================================
  //  THANK YOU SLIDE (شكراً)
  // ============================================================
  const slideThx = createSlide('MASTER_SECTION_TITLE');
  slideThx.addText(t('شكراً', 'Thank You'), {
    x: IS_RTL ? 5.5 : 0.3, y: 2.8, w: 7.5, h: 1.5,
    fontSize: 72, bold: true, color: THEME.white, align: IS_RTL ? 'right' : 'left', valign: 'middle',
    fontFace: 'Segoe UI', rtlMode: IS_RTL,
  });
  if (cfg.language === 'bilingual') {
    slideThx.addText('Thank You', {
      x: 5.5, y: 4.3, w: 7.5, h: 0.7,
      fontSize: 24, color: THEME.accent, align: 'right', valign: 'middle',
      fontFace: 'Segoe UI',
    });
  }

  // ============================================================
  //  Generate PowerPoint buffer
  // ============================================================
  console.log('[PPT Generator] Generating PowerPoint buffer...');
  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  console.log('[PPT Generator] PowerPoint generation complete, buffer size:', buffer.length);

  return buffer;
}
