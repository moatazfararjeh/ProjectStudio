/**
 * Report Template Configuration — shared between controller & pptGenerator
 */

export interface SlideImageConfig {
  imageUrl: string;
  text: string;
}

/** The 5 PowerPoint master layout keys */
export type HFLayoutKey = 'cover' | 'blank' | 'contentEmpty' | 'titleAndContent' | 'sectionTitle';

export interface HeaderFooterLayoutConfig {
  cover:            SlideImageConfig;
  blank:            SlideImageConfig;
  contentEmpty:     SlideImageConfig;
  titleAndContent:  SlideImageConfig;
  sectionTitle:     SlideImageConfig;
}

export const HF_LAYOUT_KEYS: HFLayoutKey[] = ['cover', 'blank', 'contentEmpty', 'titleAndContent', 'sectionTitle'];
export const DEFAULT_SLIDE_IMAGE: SlideImageConfig = { imageUrl: '', text: '' };
export const DEFAULT_HF_LAYOUT_CONFIG: HeaderFooterLayoutConfig = {
  cover:           { imageUrl: '', text: '' },
  blank:           { imageUrl: '', text: '' },
  contentEmpty:    { imageUrl: '', text: '' },
  titleAndContent: { imageUrl: '', text: '' },
  sectionTitle:    { imageUrl: '', text: '' },
};

export const DEFAULT_REPORT_TEMPLATE = {
  companyName: 'EPM',
  companyNameAr: '',
  logoUrlLeft: '', // Left logo URL
  logoUrlRight: '', // Right logo URL
  colors: {
    primary: '0B4F6C',
    secondary: '1A7FA1',
    accent: '2EADD3',
    success: '16A34A',
    warning: 'F59E0B',
    danger: 'DC2626',
    headerTitle: 'FFFFFF',
  },
  slides: {
    titlePage: true,
    agenda: true,
    executiveSummary: true,
    weeklyProgress: true,
    nextWeek: true,
    milestones: true,
    risksAndChallenges: true,
  },
  slideLayouts: {
    titlePage:          'cover',
    agenda:             'sectionTitle',
    executiveSummary:   'titleAndContent',
    weeklyProgress:     'titleAndContent',
    nextWeek:           'titleAndContent',
    milestones:         'contentEmpty',
    risksAndChallenges: 'contentEmpty',
  } as Record<string, string>,
  slideImages: {
    titlePage:          '',
    agenda:             '',
    executiveSummary:   '',
    weeklyProgress:     '',
    nextWeek:           '',
    milestones:         '',
    risksAndChallenges: '',
  } as Record<string, string>,
  slideTitles: {
    agenda:             '',
    executiveSummary:   '',
    weeklyProgress:     '',
    nextWeek:           '',
    milestones:         '',
    risksAndChallenges: '',
  } as Record<string, string>,
  language: 'bilingual' as 'ar' | 'en' | 'bilingual',
  milestonesPerPage: 10,
  risksPerPage: 8,
  timelinePerPage: 10,
  thisWeekPerPage: 20,
  nextWeekPerPage: 18,
  header: {
    cover:           { imageUrl: '', text: '' },
    blank:           { imageUrl: '', text: '' },
    contentEmpty:    { imageUrl: '', text: '' },
    titleAndContent: { imageUrl: '', text: '' },
    sectionTitle:    { imageUrl: '', text: '' },
  } as HeaderFooterLayoutConfig,
  footer: {
    cover:           { imageUrl: '', text: '' },
    blank:           { imageUrl: '', text: '' },
    contentEmpty:    { imageUrl: '', text: '' },
    titleAndContent: { imageUrl: '', text: '' },
    sectionTitle:    { imageUrl: '', text: '' },
  } as HeaderFooterLayoutConfig,
};

export type ReportTemplateConfig = typeof DEFAULT_REPORT_TEMPLATE;
