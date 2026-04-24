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
    info: '2563EB',
    headerBg: '0F172A',
    tableBorder: 'CBD5E1',
    tableHeaderBg: cfg.colors.primary,
    tableAltRow: 'F1F5F9',
  };
}

// Keep a module-level reference so helpers can use it (set before slide generation)
let THEME = buildTheme(DEFAULT_REPORT_TEMPLATE);

// ============================================
// HELPER: Add slide header title text
// (The colored bar comes from the master layout)
// ============================================
function addSlideHeader(slide: any, title: string) {
  slide.addText(title, {
    x: 1.0, y: 0.1, w: 11.2, h: 0.6,
    fontSize: 22, bold: true, color: THEME.white,
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

  // ── COVER: full primary color (or custom bg), accent bars top/bottom, large logos ──
  pptx.defineSlideMaster({
    title: 'MASTER_COVER',
    bkgd: { color: bkgdColor('cover', THEME.primary) },
    objects: [
      ...bgImageObjs('cover'),
      { rect: { x: 0, y: 0,    w: '100%', h: 0.15, fill: { color: THEME.accent } } },
      { rect: { x: 0, y: 7.35, w: '100%', h: 0.15, fill: { color: THEME.accent } } },
      ...logoCover(),
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

  // ── CONTENT EMPTY: primary header bar, no title text, small logos ─────────
  pptx.defineSlideMaster({
    title: 'MASTER_CONTENT_EMPTY',
    bkgd: { color: bkgdColor('contentEmpty', 'FFFFFF') },
    objects: [
      ...bgImageObjs('contentEmpty'),
      { rect: { x: 0, y: 0,   w: '100%', h: 0.8,  fill: { color: THEME.primary } } },
      { rect: { x: 0, y: 0.8, w: '100%', h: 0.04, fill: { color: THEME.accent } } },
      ...logoSmall(),
    ],
  });

  // ── TITLE AND CONTENT: header bar + accent rule, white bg, small logos ────
  pptx.defineSlideMaster({
    title: 'MASTER_TITLE_AND_CONTENT',
    bkgd: { color: bkgdColor('titleAndContent', 'FFFFFF') },
    objects: [
      ...bgImageObjs('titleAndContent'),
      { rect: { x: 0, y: 0,   w: '100%', h: 0.8,  fill: { color: THEME.primary } } },
      { rect: { x: 0, y: 0.8, w: '100%', h: 0.04, fill: { color: THEME.accent } } },
      ...logoSmall(),
    ],
  });

  // ── SECTION TITLE: secondary color bg (or custom bg), thin accent bars ────
  pptx.defineSlideMaster({
    title: 'MASTER_SECTION_TITLE',
    bkgd: { color: bkgdColor('sectionTitle', THEME.secondary) },
    objects: [
      ...bgImageObjs('sectionTitle'),
      { rect: { x: 0, y: 0,    w: '100%', h: 0.12, fill: { color: THEME.accent } } },
      { rect: { x: 0, y: 7.38, w: '100%', h: 0.12, fill: { color: THEME.accent } } },
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

  // Add per-slide background image on top of the master background
  const addSlideBg = (slide: any, slideKey: string) => {
    const url = (cfg as any).slideImages?.[slideKey];
    if (url) {
      const p = path.join(__dirname, '../../public', url);
      if (fs.existsSync(p)) {
        const ext = path.extname(p).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : 'png';
        const b64 = fs.readFileSync(p).toString('base64');
        slide.addImage({ x: 0, y: 0, w: 13.33, h: 7.5, data: `image/${mime};base64,${b64}` });
      }
    }
  };

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
      phases: { orderBy: { order: 'asc' } },
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
      phase: { select: { name: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  // Milestones = all summary tasks (tasks that have children) at any WBS level
  // Excludes leaf-level tasks (the actual work items with no subtasks)
  const parentTaskIds = new Set(
    allTasks.filter(t => t.parentId).map(t => t.parentId!)
  );
  const milestones = allTasks.filter(t => parentTaskIds.has(t.id));

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

    // Project name
    slide1.addText(project.name, {
      x: 0.8, y: 2.0, w: 11.7, h: 1.5,
      fontSize: 44, bold: true, color: THEME.white, align: 'center',
      fontFace: 'Segoe UI',
    });

    // Subtitle: تقرير حالة المشروع
    slide1.addText('تقرير حالة المشروع', {
      x: 0.8, y: 3.5, w: 11.7, h: 0.8,
      fontSize: 28, color: THEME.accent, align: 'center',
      fontFace: 'Segoe UI',
    });

    // Report date
    slide1.addText(
      `تاريخ التقرير: ${today.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      {
        x: 0.8, y: 4.6, w: 11.7, h: 0.6,
        fontSize: 18, color: THEME.white, align: 'center',
        fontFace: 'Segoe UI',
      }
    );

    // Manager info
    if (project.manager) {
      slide1.addText(
        `مدير المشروع: ${project.manager.firstName} ${project.manager.lastName}`,
        {
          x: 0.8, y: 5.4, w: 11.7, h: 0.5,
          fontSize: 14, color: THEME.lightText, align: 'center',
          fontFace: 'Segoe UI',
        }
      );
    }

  } // end titlePage

  // ============================================================
  //  SLIDE 2: AGENDA (جدول الأعمال)
  // ============================================================
  if (cfg.slides.agenda) {
    const slide2 = createSlide(masterForSlide('agenda'));
    addSlideBg(slide2, 'agenda');
    addSlideHeader(slide2, 'جدول الأعمال - Agenda');

  const agendaItems = [
    { num: '01', title: 'لوحة البيانات', subtitle: 'Dashboard', icon: '📊' },
    { num: '02', title: 'ما تم إنجازه هذا الأسبوع', subtitle: 'This Week Achievements', icon: '✅' },
    { num: '03', title: 'خطة الأسبوع القادم', subtitle: 'Next Week Plan', icon: '📅' },
    { num: '04', title: 'المعالم الرئيسية', subtitle: 'Key Milestones', icon: '🏁' },
    { num: '05', title: 'المخاطر والتحديات', subtitle: 'Risks & Challenges', icon: '⚠️' },
  ];

  let agendaY = 1.8;
  agendaItems.forEach((item) => {
    // Number circle
    slide2.addShape('ellipse' as any, {
      x: 1.5, y: agendaY - 0.1, w: 0.9, h: 0.9,
      fill: { color: THEME.primary },
    });
    slide2.addText(item.num, {
      x: 1.5, y: agendaY, w: 0.9, h: 0.7,
      fontSize: 22, bold: true, color: THEME.white, align: 'center', valign: 'middle',
    });

    // Title (Arabic RTL)
    slide2.addText(item.title, {
      x: 2.8, y: agendaY - 0.05, w: 8, h: 0.5,
      fontSize: 22, bold: true, color: THEME.dark,
      fontFace: 'Segoe UI',
    });

    // Subtitle (English)
    slide2.addText(item.subtitle, {
      x: 2.8, y: agendaY + 0.45, w: 8, h: 0.35,
      fontSize: 14, color: THEME.lightText,
      fontFace: 'Segoe UI',
    });

    agendaY += 1.6;
  });

  } // end agenda

  // ============================================================
  //  SLIDE 3: EXECUTIVE SUMMARY (ملخص تنفيذي)
  // ============================================================
  if (cfg.slides.executiveSummary) {
    const slide3 = createSlide(masterForSlide('executiveSummary'));
    addSlideBg(slide3, 'executiveSummary');
    addSlideHeader(slide3, 'لوحة البيانات - Dashboard');

  // Progress cards row
  const cards = [
    { label: 'الإنجاز الفعلي\nActual Progress', value: `${actualProgress.toFixed(1)}%`, color: THEME.success },
    { label: 'الإنجاز المخطط\nPlanned Progress', value: `${plannedProgress.toFixed(1)}%`, color: THEME.info },
    { label: 'التباين\nVariance', value: varianceIndicator(plannedProgress, actualProgress), color: varianceColor(plannedProgress, actualProgress) },
    { label: 'حالة المشروع\nProject Status', value: project.status.replace('_', ' '), color: THEME.secondary },
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
    { label: 'إجمالي المهام\nTotal Tasks', value: totalTasks.toString(), color: THEME.primary },
    { label: 'مكتملة\nCompleted', value: completedCount.toString(), color: THEME.success },
    { label: 'قيد التنفيذ\nIn Progress', value: inProgressCount.toString(), color: THEME.info },
    { label: 'متأخرة\nOverdue', value: overdueTasks.toString(), color: THEME.danger },
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
  slide3.addText('مدة المشروع / Project Duration', {
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
  //  SLIDE 4: THIS WEEK (ما تم إنجازه هذا الأسبوع)
  // ============================================================
  if (cfg.slides.weeklyProgress) {
    const slide4 = createSlide(masterForSlide('weeklyProgress'));
    addSlideBg(slide4, 'weeklyProgress');
    addSlideHeader(slide4, 'ما تم إنجازه هذا الأسبوع - This Week Achievements');

  if (completedThisWeek.length === 0) {
    slide4.addText('لا توجد مهام مكتملة هذا الأسبوع / No tasks completed this week', {
      x: 0.5, y: 2.5, w: 12, h: 1,
      fontSize: 16, color: THEME.lightText, italic: true, align: 'center',
    });
  } else {
    // Group completed tasks by phase
    const byPhase: Record<string, typeof completedThisWeek> = {};
    completedThisWeek.forEach(t => {
      const phase = t.phase?.name || 'غير محدد / Unassigned';
      if (!byPhase[phase]) byPhase[phase] = [];
      byPhase[phase].push(t);
    });

    const rows4: any[][] = [
      [headerCell('#'), headerCell('المهمة / Task'), headerCell('المرحلة / Phase'), headerCell('المسؤول / Assignee'), headerCell('تاريخ الإنجاز / Completed')],
    ];

    let rowNum4 = 1;
    Object.entries(byPhase).forEach(([phaseName, phaseTasks]) => {
      phaseTasks.slice(0, 20).forEach((task) => {
        const assignee = task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '-';
        const rowFill = rowNum4 % 2 === 0 ? {} : { fill: { color: THEME.tableAltRow } };
        rows4.push([
          dataCell(rowNum4.toString(), rowFill),
          dataCell(task.name, { align: 'left', ...rowFill }),
          dataCell(phaseName, rowFill),
          dataCell(assignee, rowFill),
          dataCell(fmtDate(task.updatedAt), rowFill),
        ]);
        rowNum4++;
      });
    });

    slide4.addTable(rows4, {
      x: 0.3, y: 1.0, w: 12.7,
      colW: [0.5, 4.5, 2.5, 2.8, 2.4],
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
  slide4.addText(`الإنجاز الفعلي ${actualProgress.toFixed(1)}% / Actual Progress`, {
    x: 0.5, y: bY4, w: 12, h: 0.3, fontSize: 9, bold: true, color: THEME.white, align: 'center', valign: 'middle',
  });

  } // end weeklyProgress

  // ============================================================
  //  SLIDE 5: NEXT WEEK PLAN (خطة الأسبوع القادم)
  // ============================================================
  if ((cfg.slides as any).nextWeek) {
    const slide5 = createSlide(masterForSlide('nextWeek'));
    addSlideBg(slide5, 'nextWeek');
    addSlideHeader(slide5, 'خطة الأسبوع القادم - Next Week Plan');

  if (plannedNextWeek.length === 0) {
    slide5.addText('لا توجد مهام مخططة للأسبوع القادم / No tasks planned for next week', {
      x: 0.5, y: 2.5, w: 12, h: 1,
      fontSize: 16, color: THEME.lightText, italic: true, align: 'center',
    });
  } else {
    const rows5: any[][] = [
      [headerCell('#'), headerCell('المهمة / Task'), headerCell('المرحلة / Phase'), headerCell('المسؤول / Assignee'), headerCell('تاريخ البدء / Start'), headerCell('الموعد النهائي / Due')],
    ];
    plannedNextWeek.slice(0, 18).forEach((task, idx) => {
      const assignee = task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '-';
      const phaseName = task.phase?.name || '-';
      const rowFill = idx % 2 === 0 ? {} : { fill: { color: THEME.tableAltRow } };
      rows5.push([
        dataCell((idx + 1).toString(), rowFill),
        dataCell(task.name, { align: 'left', ...rowFill }),
        dataCell(phaseName, rowFill),
        dataCell(assignee, rowFill),
        dataCell(fmtDate(task.startDate), rowFill),
        dataCell(fmtDate(task.endDate), rowFill),
      ]);
    });

    slide5.addTable(rows5, {
      x: 0.3, y: 1.0, w: 12.7,
      colW: [0.5, 4.0, 2.3, 2.5, 1.7, 1.7],
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
  slide5.addText(`الإنجاز المخطط ${plannedProgress.toFixed(1)}% / Planned Progress`, {
    x: 0.5, y: bY5, w: 12, h: 0.3, fontSize: 9, bold: true, color: THEME.white, align: 'center', valign: 'middle',
  });

  } // end nextWeek

  // ============================================================
  //  SLIDE 6: KEY MILESTONES (المعالم الرئيسية)
  // ============================================================
  if (cfg.slides.milestones) {
    // May need multiple slides if too many milestones
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
      addSlideHeader(slideR, `المخاطر / التحديات - Risks & Challenges${pageLabel}`);

    const risksOnPage = activeRisks.slice(page * RISKS_PER_PAGE, (page + 1) * RISKS_PER_PAGE);

    const riskHeaders = [
      headerCell('وصف الخطر / التحدي\nDescription'),
      headerCell('التصنيف\nType'),
      headerCell('النطاق\nScope'),
      headerCell('الفئة\nPriority'),
      headerCell('الاحتمالية\nProbability'),
      headerCell('التأثير\nImpact'),
      headerCell('خطة المعالجة\nMitigation Plan'),
      headerCell('تاريخ الإغلاق المستهدف\nTarget Close'),
      headerCell('المسؤول\nOwner'),
      headerCell('الحالة\nStatus'),
    ];

    const riskRows: any[][] = [riskHeaders];

    risksOnPage.forEach((item, idx) => {
      const rowFill = idx % 2 === 0 ? {} : { fill: { color: THEME.tableAltRow } };
      const ownerName = item.owner ? `${item.owner.firstName} ${item.owner.lastName}` : '-';

      // Map probability & impact enums to Arabic/English
      const probMap: Record<string, string> = {
        VERY_LOW: 'منخفض جداً', LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'عالي', VERY_HIGH: 'عالي جداً',
      };
      const impactMap: Record<string, string> = {
        LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'عالي', VERY_HIGH: 'عالي جداً', CRITICAL: 'حرج',
      };
      const statusMap: Record<string, string> = {
        OPEN: 'مفتوح', IN_PROGRESS: 'قيد المعالجة', MITIGATED: 'تم التخفيف', CLOSED: 'مغلق',
      };

      const statusClr = item.status === 'CLOSED' ? THEME.success
        : item.status === 'MITIGATED' ? THEME.warning
        : item.status === 'OPEN' ? THEME.danger
        : THEME.info;

      riskRows.push([
        dataCell(item.title, { align: 'left', fontSize: 7, ...rowFill }),
        dataCell(item.type === 'RISK' ? 'خطر / Risk' : 'تحدي / Issue', rowFill),
        dataCell(item.impactDescription ? item.impactDescription.substring(0, 20) : '-', { fontSize: 7, ...rowFill }),
        dataCell(item.priority || '-', rowFill),
        dataCell(item.probability ? probMap[item.probability] || item.probability : '-', rowFill),
        dataCell(item.impact ? impactMap[item.impact] || item.impact : '-', rowFill),
        dataCell(item.mitigation ? item.mitigation.substring(0, 35) : '-', { align: 'left', fontSize: 7, ...rowFill }),
        dataCell(fmtDate(item.targetDate || item.revisedTargetDate), rowFill),
        dataCell(ownerName, rowFill),
        dataCell(statusMap[item.status] || item.status, { color: statusClr, bold: true, ...rowFill }),
      ]);
    });

    slideR.addTable(riskRows, {
      x: 0.15, y: 1.0, w: 13.0,
      colW: [2.2, 1.0, 1.0, 0.8, 1.0, 0.9, 2.2, 1.2, 1.3, 1.0],
      rowH: 0.42,
      border: { pt: 0.5, color: THEME.tableBorder },
    });

    if (activeRisks.length === 0) {
      slideR.addText('لا توجد مخاطر أو تحديات نشطة حالياً', {
        x: 1, y: 3, w: 11, h: 1,
        fontSize: 16, color: THEME.lightText, italic: true, align: 'center',
      });
    }
  }

  } // end risksAndChallenges

  // ============================================================
  //  Generate PowerPoint buffer
  // ============================================================
  console.log('[PPT Generator] Generating PowerPoint buffer...');
  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  console.log('[PPT Generator] PowerPoint generation complete, buffer size:', buffer.length);

  return buffer;
}
