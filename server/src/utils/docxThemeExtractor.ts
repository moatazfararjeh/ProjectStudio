import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';

export interface ExtractedTheme {
  primaryColor:   string;  // accent1
  secondaryColor: string;  // dk2 / accent2
  accentColor:    string;  // accent3 / lt2
  fontHeading:    string;
  fontBody:       string;
  /** Raw colours map: dk1,dk2,lt1,lt2,accent1..accent6 */
  raw: Record<string, string>;
}

function normHex(val?: string): string {
  if (!val) return '';
  const v = val.replace(/^#/, '').toUpperCase();
  return v.length === 6 ? v : '';
}

/**
 * Extract theme colours and fonts from a .docx file.
 * Returns null if the file has no theme or is not a valid docx.
 */
export async function extractDocxTheme(filePath: string): Promise<ExtractedTheme | null> {
  try {
    const zip = new AdmZip(filePath);
    const themeEntry = zip.getEntry('word/theme/theme1.xml');
    if (!themeEntry) return null;

    const xml = themeEntry.getData().toString('utf8');
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    // Navigate: a:theme > a:themeElements > a:clrScheme, a:fontScheme
    const themeEl = parsed['a:theme']?.['a:themeElements'];
    if (!themeEl) return null;

    const clrScheme = themeEl['a:clrScheme'];
    const fontScheme = themeEl['a:fontScheme'];

    function getColor(node: any): string {
      if (!node) return '';
      const srgb = node['a:srgbClr'];
      if (srgb) return normHex(typeof srgb === 'string' ? srgb : srgb?.['$']?.val || srgb);
      const sys = node['a:sysClr'];
      if (sys) return normHex(typeof sys === 'string' ? sys : sys?.['$']?.lastClr || '');
      return '';
    }

    const raw: Record<string, string> = {
      dk1:     getColor(clrScheme?.['a:dk1']),
      lt1:     getColor(clrScheme?.['a:lt1']),
      dk2:     getColor(clrScheme?.['a:dk2']),
      lt2:     getColor(clrScheme?.['a:lt2']),
      accent1: getColor(clrScheme?.['a:accent1']),
      accent2: getColor(clrScheme?.['a:accent2']),
      accent3: getColor(clrScheme?.['a:accent3']),
      accent4: getColor(clrScheme?.['a:accent4']),
      accent5: getColor(clrScheme?.['a:accent5']),
      accent6: getColor(clrScheme?.['a:accent6']),
    };

    // Font extraction
    const majorFont = fontScheme?.['a:majorFont']?.['a:latin']?.['$']?.typeface || '';
    const minorFont = fontScheme?.['a:minorFont']?.['a:latin']?.['$']?.typeface || '';

    return {
      primaryColor:   raw.accent1 || raw.dk2 || '0B4F6C',
      secondaryColor: raw.accent2 || raw.dk1 || '1A7FA1',
      accentColor:    raw.accent3 || raw.lt2 || '2EADD3',
      fontHeading: majorFont,
      fontBody:    minorFont,
      raw,
    };
  } catch (err) {
    console.error('[extractDocxTheme] error:', err);
    return null;
  }
}
