import { parseString } from 'xml2js';

const parseXMLPromise = (xml: string, options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    parseString(xml, options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export interface ParsedTask {
  uid: string;
  name: string;
  start: string;
  finish: string;
  duration: number; // in days
  percentComplete: number;
  priority: number;
  notes?: string;
  outlineLevel: number;
  outlineNumber?: string; // e.g., "1.1.1.1.1"
  predecessors?: string[]; // UIDs of predecessor tasks
  wbs?: string;
  resourceIds?: string[]; // Resource UIDs assigned to this task
}

export interface ParsedResource {
  uid: string;
  name: string;
  email?: string;
  type?: string; // Work, Material, Cost
  initials?: string;
}

export interface ParsedAssignment {
  uid: string;
  taskUid: string;
  resourceUid: string;
  units?: number; // Percentage like 100 for 100%
}

export interface ParsedMPPData {
  projectName: string;
  startDate: string;
  finishDate: string;
  tasks: ParsedTask[];
  resources: ParsedResource[];
  assignments: ParsedAssignment[];
}

/**
 * Parse MS Project XML file
 * MS Project can export to XML format (.xml) which is easier to parse than binary .mpp
 * @param xmlContent - The XML content from MS Project export
 * @param hoursPerDay - Hours per working day (default: 8)
 */
export async function parseMPPXML(xmlContent: string, hoursPerDay: number = 8): Promise<ParsedMPPData> {
  try {
    const result: any = await parseXMLPromise(xmlContent, {
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
    });

    const project = result.Project;
    
    if (!project) {
      throw new Error('Invalid MS Project XML format');
    }

    const projectName = project.Name || project.Title || 'Imported Project';
    const startDate = project.StartDate || new Date().toISOString();
    const finishDate = project.FinishDate || new Date().toISOString();

    // Parse resources
    let resourcesArray = project.Resources?.Resource || [];
    if (!Array.isArray(resourcesArray)) {
      resourcesArray = [resourcesArray];
    }

    const resources: ParsedResource[] = resourcesArray
      .filter((resource: any) => resource && resource.UID && resource.Name)
      .map((resource: any) => ({
        uid: resource.UID.toString(),
        name: resource.Name,
        email: resource.EmailAddress || undefined,
        type: resource.Type || 'Work',
        initials: resource.Initials || undefined,
      }));

    // Parse assignments
    let assignmentsArray = project.Assignments?.Assignment || [];
    if (!Array.isArray(assignmentsArray)) {
      assignmentsArray = [assignmentsArray];
    }

    const assignments: ParsedAssignment[] = assignmentsArray
      .filter((assignment: any) => assignment && assignment.UID && assignment.TaskUID && assignment.ResourceUID)
      .map((assignment: any) => ({
        uid: assignment.UID.toString(),
        taskUid: assignment.TaskUID.toString(),
        resourceUid: assignment.ResourceUID.toString(),
        units: parseFloat(assignment.Units || '100'),
      }));

    // Build a map of task UID to resource UIDs for quick lookup
    const taskResourceMap = new Map<string, string[]>();
    for (const assignment of assignments) {
      const existing = taskResourceMap.get(assignment.taskUid) || [];
      existing.push(assignment.resourceUid);
      taskResourceMap.set(assignment.taskUid, existing);
    }

    // Parse tasks
    let tasksArray = project.Tasks?.Task || [];
    if (!Array.isArray(tasksArray)) {
      tasksArray = [tasksArray];
    }

    const tasks: ParsedTask[] = tasksArray
      .filter((task: any) => task && task.UID && task.Name)
      .map((task: any) => {
        // Parse duration using the dedicated mapper with project-specific hours per day
        const durationDays = task.Duration ? mapDuration(task.Duration, hoursPerDay) : 0;

        // Parse predecessors
        let predecessors: string[] = [];
        if (task.PredecessorLink) {
          let predLinks = Array.isArray(task.PredecessorLink) 
            ? task.PredecessorLink 
            : [task.PredecessorLink];
          predecessors = predLinks
            .map((pred: any) => pred.PredecessorUID)
            .filter((uid: any) => uid);
        }

        // Parse outline level - MS Project uses OutlineLevel field
        // OutlineLevel 1 = top-level tasks, 2 = first level subtasks, etc.
        const outlineLevel = parseInt(task.OutlineLevel || '1', 10);
        
        // Parse outline number - hierarchical numbering like "1.1.1.1.1"
        const outlineNumber = task.OutlineNumber || undefined;
        
        console.log(`[MPP Parser] Task UID ${task.UID}: "${task.Name}" - OutlineNumber: "${outlineNumber || 'NONE'}", OutlineLevel: ${outlineLevel}`);

        return {
          uid: task.UID.toString(),
          name: task.Name,
          start: task.Start || startDate,
          finish: task.Finish || task.Start || startDate,
          duration: durationDays,
          percentComplete: parseFloat(task.PercentComplete || '0'),
          priority: parseInt(task.Priority || '500', 10),
          notes: task.Notes || undefined,
          outlineLevel,
          outlineNumber,
          predecessors,
          wbs: task.WBS || undefined,
          resourceIds: taskResourceMap.get(task.UID.toString()) || [],
        };
      });

    // Sort tasks by outline number to ensure parents are processed before children
    // Tasks without outline numbers are placed at the end
    tasks.sort((a, b) => {
      // If both have outline numbers, compare them hierarchically
      if (a.outlineNumber && b.outlineNumber) {
        const aParts = a.outlineNumber.split('.').map(n => parseInt(n, 10));
        const bParts = b.outlineNumber.split('.').map(n => parseInt(n, 10));
        
        // Compare each level
        const maxLength = Math.max(aParts.length, bParts.length);
        for (let i = 0; i < maxLength; i++) {
          const aVal = aParts[i] || 0;
          const bVal = bParts[i] || 0;
          if (aVal !== bVal) {
            return aVal - bVal;
          }
        }
        return 0;
      }
      
      // Tasks with outline numbers come before tasks without
      if (a.outlineNumber && !b.outlineNumber) return -1;
      if (!a.outlineNumber && b.outlineNumber) return 1;
      
      // If neither has outline number, sort by UID
      return parseInt(a.uid, 10) - parseInt(b.uid, 10);
    });

    return {
      projectName,
      startDate,
      finishDate,
      tasks,
      resources,
      assignments,
    };
  } catch (error) {
    console.error('Error parsing MPP XML:', error);
    throw new Error('Failed to parse MS Project file. Please ensure it is a valid MS Project XML export.');
  }
}

/**
 * Map MS Project priority to our system priority
 */
export function mapPriority(msPriority: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (msPriority >= 800) return 'CRITICAL';
  if (msPriority >= 600) return 'HIGH';
  if (msPriority >= 400) return 'MEDIUM';
  return 'LOW';
}

/**
 * Map MS Project percent complete to status
 */
export function mapStatus(percentComplete: number): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' {
  if (percentComplete === 0) return 'NOT_STARTED';
  if (percentComplete === 100) return 'COMPLETED';
  return 'IN_PROGRESS';
}

/**
 * Map MS Project duration to days
 * Handles ISO 8601 duration format used by MS Project
 * Examples:
 * - PT8H = 8 hours = 1 day (assuming 8 hour workday)
 * - P1D = 1 day
 * - P1W = 1 week = 5 days (5 working days)
 * - PT8H30M = 8.5 hours = 1.0625 days
 * - P2DT4H = 2 days + 4 hours = 2.5 days
 */
export function mapDuration(durationStr: string, hoursPerDay: number = 8): number {
  if (!durationStr) return 0;

  let totalDays = 0;
  const str = durationStr.toString().toUpperCase();

  // Handle simple numeric values (already in days)
  if (!isNaN(parseFloat(str)) && !str.includes('P') && !str.includes('T')) {
    return parseFloat(str);
  }

  // Parse ISO 8601 duration format
  // Format: P[n]Y[n]M[n]DT[n]H[n]M[n]S or P[n]W
  
  // Check for weeks (P1W = 1 week = 5 working days)
  const weeksMatch = str.match(/P(\d+(?:\.\d+)?)W/);
  if (weeksMatch) {
    const weeks = parseFloat(weeksMatch[1]);
    return weeks * 5; // 5 working days per week
  }

  // Extract days (P2D or P1DT...)
  const daysMatch = str.match(/P(?:\d+Y)?(?:\d+M)?(\d+(?:\.\d+)?)D/);
  if (daysMatch) {
    totalDays += parseFloat(daysMatch[1]);
  }

  // Extract hours (PT8H or ...DT8H...)
  const hoursMatch = str.match(/T(\d+(?:\.\d+)?)H/);
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1]);
    totalDays += hours / hoursPerDay;
  }

  // Extract minutes (PT30M or ...H30M...)
  const minutesMatch = str.match(/T(?:\d+H)?(\d+(?:\.\d+)?)M/);
  if (minutesMatch) {
    const minutes = parseFloat(minutesMatch[1]);
    totalDays += minutes / (hoursPerDay * 60);
  }

  // If no match found but contains PT prefix, try basic hour extraction
  if (totalDays === 0 && str.includes('PT')) {
    const basicHoursMatch = str.match(/PT(\d+)/);
    if (basicHoursMatch) {
      const hours = parseFloat(basicHoursMatch[1]);
      totalDays = hours / hoursPerDay;
    }
  }

  // Round to 2 decimal places
  return Math.round(totalDays * 100) / 100;
}

/**
 * Get parent outline number from a given outline number
 * Examples:
 * - "1.1.1.1.1" -> "1.1.1.1"
 * - "1.1" -> "1"
 * - "1" -> undefined (top level)
 * @param outlineNumber - The outline number (e.g., "1.1.1.1.1")
 * @returns The parent outline number or undefined if top level
 */
export function getParentOutlineNumber(outlineNumber: string): string | undefined {
  if (!outlineNumber) {
    console.log('[getParentOutlineNumber] No outline number provided');
    return undefined;
  }
  
  const segments = outlineNumber.split('.');
  console.log(`[getParentOutlineNumber] Outline: "${outlineNumber}" -> Segments:`, segments);
  
  if (segments.length <= 1) {
    // Top level task, no parent
    console.log(`[getParentOutlineNumber] "${outlineNumber}" is top-level, no parent`);
    return undefined;
  }
  
  // Remove last segment to get parent
  segments.pop();
  const parentOutline = segments.join('.');
  console.log(`[getParentOutlineNumber] "${outlineNumber}" -> Parent: "${parentOutline}"`);
  return parentOutline;
}
