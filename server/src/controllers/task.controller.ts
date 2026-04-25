import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { parseMPPXML, mapPriority, mapStatus, getParentOutlineNumber } from '../utils/mppParser';

const taskSchema = z.object({
  projectId: z.string(),
  parentId: z.string().optional().nullable(),
  name: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  baselineStart:  z.string().optional().nullable(),
  baselineFinish: z.string().optional().nullable(),
  actualStart:    z.string().optional().nullable(),
  actualFinish:   z.string().optional().nullable(),
  duration: z.union([z.number(), z.string().transform(v => parseFloat(v) || 1)]).optional().default(1),
  plannedHours: z.number().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  assignedToId: z.string().optional().nullable(),
  assigneeName: z.string().optional().nullable(),
});

/**
 * Calculate and update parent task progress based on its subtasks
 * Recursively updates all ancestor tasks up the hierarchy
 */
async function updateParentProgress(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { parentId: true },
  });

  if (!task || !task.parentId) {
    return; // No parent to update
  }

  // Get all subtasks of the parent
  const subtasks = await prisma.task.findMany({
    where: { parentId: task.parentId },
    select: { id: true, name: true, progress: true, status: true },
  });

  if (subtasks.length === 0) {
    return;
  }

  // Calculate average progress
  const totalProgress = subtasks.reduce((sum, subtask) => sum + (subtask.progress || 0), 0);
  const averageProgress = Math.round(totalProgress / subtasks.length);

  // Check if all subtasks are completed
  const allCompleted = subtasks.every(subtask => 
    subtask.progress === 100 || subtask.status === 'COMPLETED'
  );

  // Check if all subtasks are not started
  const allNotStarted = subtasks.every(subtask => 
    subtask.progress === 0 || subtask.status === 'NOT_STARTED'
  );

  // Determine status based on progress and subtask states
  let newStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  if (allCompleted || averageProgress === 100) {
    newStatus = 'COMPLETED';
  } else if (allNotStarted || averageProgress === 0) {
    newStatus = 'NOT_STARTED';
  } else {
    newStatus = 'IN_PROGRESS';
  }

  console.log(`\n[updateParentProgress] Parent Task ID: ${task.parentId}`);
  console.log(`  Total Subtasks: ${subtasks.length}`);
  console.log(`  Average Progress: ${averageProgress}%`);
  console.log(`  All Completed: ${allCompleted}`);
  console.log(`  New Status: ${newStatus}`);
  console.log(`  Subtask Details:`);
  subtasks.forEach((st, idx) => {
    console.log(`    ${idx + 1}. "${st.name}" - ${st.progress}% ${st.status}`);
  });

  // Update parent task
  await prisma.task.update({
    where: { id: task.parentId },
    data: {
      progress: averageProgress,
      status: newStatus,
    },
  });

  // Recursively update grandparent and ancestors
  await updateParentProgress(task.parentId);
}

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, assignedToId, status } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId && { projectId: projectId as string }),
        ...(assignedToId && { assignedToId: assignedToId as string }),
        ...(status && { status: status as any }),
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        parent: {
          select: { id: true, name: true },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, name: true, status: true },
            },
          },
        },
        _count: {
          select: { subtasks: true, worklogs: true, comments: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    res.json({
      status: 'success',
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: id as string },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        parent: {
          select: { id: true, name: true },
        },
        subtasks: {
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        dependencies: {
          include: {
            dependsOn: true,
          },
        },
        worklogs: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
          orderBy: { date: 'desc' },
        },
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = taskSchema.parse(req.body);

    // Determine order: place after the last existing task in the project
    // (or after the last sibling if parentId is given)
    const lastTask = await prisma.task.findFirst({
      where: { projectId: data.projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastTask?.order ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        ...data,
        order: nextOrder,
        startDate:      data.startDate      ? new Date(data.startDate)      : new Date(),
        endDate:        data.endDate        ? new Date(data.endDate)        : new Date(),
        baselineStart:  data.baselineStart  ? new Date(data.baselineStart)  : undefined,
        baselineFinish: data.baselineFinish ? new Date(data.baselineFinish) : undefined,
        actualStart:    data.actualStart    ? new Date(data.actualStart)    : undefined,
        actualFinish:   data.actualFinish   ? new Date(data.actualFinish)   : undefined,
        createdById: req.user!.id,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Update parent progress if task has a parent
    if (data.parentId) {
      await updateParentProgress(task.id);
    }

    res.status(201).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Get current task to check existing values
    const currentTask = await prisma.task.findUnique({
      where: { id: id as string },
      select: { progress: true, status: true },
    });

    if (!currentTask) {
      throw new AppError('Task not found', 404);
    }

    // Sync progress and status
    // If progress is being changed manually, update status accordingly
    if (data.progress !== undefined && data.status === undefined) {
      if (data.progress === 0) {
        data.status = 'NOT_STARTED';
      } else if (data.progress === 100) {
        data.status = 'COMPLETED';
      } else if (data.progress > 0 && data.progress < 100) {
        data.status = 'IN_PROGRESS';
      }
    }

    // If status is being changed manually, adjust progress accordingly
    if (data.status !== undefined && data.progress === undefined) {
      if (data.status === 'COMPLETED') {
        data.progress = 100;
      } else if (data.status === 'NOT_STARTED') {
        data.progress = 0;
      } else if (data.status === 'IN_PROGRESS') {
        // If changing to IN_PROGRESS, ensure progress is between 1-99
        if (currentTask.progress === 0 || currentTask.progress === 100) {
          data.progress = 1; // Set to 1% to indicate started
        }
        // Otherwise keep existing progress
      }
    }

    const task = await prisma.task.update({
      where: { id: id as string },
      data: {
        ...data,
        ...(data.startDate      && { startDate:      new Date(data.startDate) }),
        ...(data.endDate        && { endDate:        new Date(data.endDate) }),
        ...(data.baselineStart  !== undefined && { baselineStart:  data.baselineStart  ? new Date(data.baselineStart)  : null }),
        ...(data.baselineFinish !== undefined && { baselineFinish: data.baselineFinish ? new Date(data.baselineFinish) : null }),
        ...(data.actualStart    !== undefined && { actualStart:    data.actualStart    ? new Date(data.actualStart)    : null }),
        ...(data.actualFinish   !== undefined && { actualFinish:   data.actualFinish   ? new Date(data.actualFinish)   : null }),
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Update parent task progress if progress or status changed
    if (data.progress !== undefined || data.status !== undefined) {
      await updateParentProgress(id as string);
    }

    res.json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get task's parent before deletion
    const task = await prisma.task.findUnique({
      where: { id: id as string },
      select: { parentId: true },
    });

    const parentId = task?.parentId;

    await prisma.task.delete({
      where: { id: id as string },
    });

    // Update parent progress after deletion
    // We need to pass a remaining child's ID to trigger the recalculation
    if (parentId) {
      // Find any remaining sibling to trigger parent update
      const sibling = await prisma.task.findFirst({
        where: { parentId },
        select: { id: true },
      });
      
      if (sibling) {
        await updateParentProgress(sibling.id);
      } else {
        // No siblings left, reset parent to 0%
        await prisma.task.update({
          where: { id: parentId },
          data: { progress: 0, status: 'NOT_STARTED' },
        });
      }
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const createDependency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { dependsOnId, type, lag } = req.body;

    const dependency = await prisma.taskDependency.create({
      data: {
        taskId: id as string,
        dependsOnId,
        type: type || 'FS',
        lag: lag || 0,
      },
      include: {
        dependsOn: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { dependency },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDependency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { depId } = req.params;

    await prisma.taskDependency.delete({
      where: { id: depId as string },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const importMPP = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.body;
    const userId = req.user!.id;

    if (!projectId) {
      throw new AppError('Project ID is required', 400);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if user is project manager or member
    const isManager = project.managerId === userId;
    const isMember = project.members.length > 0;

    if (!isManager && !isMember) {
      throw new AppError('You do not have access to this project', 403);
    }

    // Get hours per day from project settings (default to 8)
    const projectSettings = project.settings as any;
    const hoursPerDay = projectSettings?.hoursPerDay || 8;

    // Delete existing tasks for this project before re-importing
    // (delete dependencies first due to FK constraints)
    await prisma.taskDependency.deleteMany({
      where: { task: { projectId } },
    });
    await prisma.task.deleteMany({
      where: { projectId },
    });
    console.log(`[MPP Import] Cleared existing tasks for project ${projectId}`);

    // Read and parse the file
    const fileContent = req.file.buffer.toString('utf-8');
    const parsedData = await parseMPPXML(fileContent, hoursPerDay);

    // Create a map to store task UIDs to database IDs
    const taskUidToIdMap = new Map<string, string>();
    const taskDependencies: Array<{ taskId: string; dependsOnId: string }> = [];
    
    // Map outline numbers to task IDs for parent-child linking
    const outlineNumberToIdMap = new Map<string, string>();

    // Map MS Project resources to EPM users
    // Fetch all project members to match against MS Project resources
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create resource UID to user ID mapping
    const resourceUidToUserIdMap = new Map<string, string>();
    const unmatchedResources: string[] = [];

    for (const resource of parsedData.resources) {
      // Try to match by email first (most reliable)
      let matchedUser = projectMembers.find(
        member => member.user && member.user.email.toLowerCase() === resource.email?.toLowerCase()
      );

      // If no email match, try matching by name
      if (!matchedUser && resource.name) {
        matchedUser = projectMembers.find(member => {
          if (!member.user) {
            // For non-portal members, match by memberName
            const memberName = (member.memberName || '').toLowerCase();
            const resourceName = resource.name.toLowerCase();
            return memberName === resourceName;
          }
          const fullName = `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
          const resourceName = resource.name.toLowerCase();
          return fullName === resourceName || 
                 member.user.firstName.toLowerCase() === resourceName ||
                 member.user.lastName.toLowerCase() === resourceName;
        });
      }

      if (matchedUser) {
        resourceUidToUserIdMap.set(resource.uid, matchedUser.user?.id || matchedUser.id);
      } else {
        unmatchedResources.push(resource.name);
      }
    }

    // Build task UID to assignee mapping based on assignments
    // Map resource UID to resource name (for unmatched resources)
    const resourceUidToNameMap = new Map<string, string>();
    for (const resource of parsedData.resources) {
      if (resource.name) resourceUidToNameMap.set(resource.uid, resource.name);
    }

    const taskUidToAssigneeMap = new Map<string, string>();
    const taskUidToAssigneeNameMap = new Map<string, string>();
    for (const assignment of parsedData.assignments) {
      const userId = resourceUidToUserIdMap.get(assignment.resourceUid);
      if (userId) {
        if (!taskUidToAssigneeMap.has(assignment.taskUid)) {
          taskUidToAssigneeMap.set(assignment.taskUid, userId);
        }
      } else {
        // No portal user match — store the resource name
        const resourceName = resourceUidToNameMap.get(assignment.resourceUid);
        if (resourceName && !taskUidToAssigneeNameMap.has(assignment.taskUid)) {
          taskUidToAssigneeNameMap.set(assignment.taskUid, resourceName);
        }
      }
    }

    console.log('\n=== MPP IMPORT: Starting Task Creation ===');
    console.log(`Total tasks to process: ${parsedData.tasks.length}`);
    console.log(`Resources matched: ${resourceUidToUserIdMap.size}`);
    console.log(`Assignments mapped: ${taskUidToAssigneeMap.size}\n`);

    // First pass: Create all tasks with parent-child hierarchy
    // Use index for order since parsedData.tasks is already sorted hierarchically
    let taskOrder = 0;
    for (const parsedTask of parsedData.tasks) {
      // Skip summary tasks (outline level 0) unless they have no parents
      if (parsedTask.outlineLevel === 0 && parsedData.tasks.length > 1) {
        continue;
      }

      // Determine parent task using outline number (more reliable than outline level)
      // Example: "1.1.1.1.1" -> parent is "1.1.1.1"
      let parentId: string | undefined = undefined;
      
      console.log(`\n--- Processing Task: "${parsedTask.name}" (UID: ${parsedTask.uid}) ---`);
      console.log(`  Outline Number: ${parsedTask.outlineNumber || 'NONE'}`);
      console.log(`  Outline Level: ${parsedTask.outlineLevel}`);
      
      if (parsedTask.outlineNumber) {
        const parentOutlineNumber = getParentOutlineNumber(parsedTask.outlineNumber);
        console.log(`  Parent Outline Number: ${parentOutlineNumber || 'NONE (Top Level)'}`);
        
        if (parentOutlineNumber) {
          parentId = outlineNumberToIdMap.get(parentOutlineNumber);
          console.log(`  Parent ID from Map: ${parentId || 'NOT FOUND IN MAP'}`);
          
          if (!parentId) {
            console.log(`  ⚠️  WARNING: Parent outline "${parentOutlineNumber}" not found in map`);
            console.log(`  Current map keys:`, Array.from(outlineNumberToIdMap.keys()));
          }
        }
      } else {
        console.log(`  ⚠️  WARNING: Task has no outline number!`);
      }

      // Get assignee from mapping
      const assignedToId = taskUidToAssigneeMap.get(parsedTask.uid);
      const assigneeName = !assignedToId ? (taskUidToAssigneeNameMap.get(parsedTask.uid) || undefined) : undefined;
      console.log(`  Assigned To: ${assignedToId || assigneeName || 'Unassigned'}`);

      const task = await prisma.task.create({
        data: {
          projectId,
          name: parsedTask.name,
          description: parsedTask.notes || undefined,
          startDate: new Date(parsedTask.start),
          endDate: new Date(parsedTask.finish),
          actualStart:    parsedTask.actualStart   ? new Date(parsedTask.actualStart)   : undefined,
          actualFinish:   parsedTask.actualFinish  ? new Date(parsedTask.actualFinish)  : undefined,
          baselineStart:  parsedTask.baselineStart ? new Date(parsedTask.baselineStart) : undefined,
          baselineFinish: parsedTask.baselineFinish? new Date(parsedTask.baselineFinish): undefined,
          duration: parsedTask.duration || 1,
          plannedHours: (parsedTask.duration || 1) * hoursPerDay,
          priority: mapPriority(parsedTask.priority),
          status: mapStatus(parsedTask.percentComplete),
          progress: parsedTask.percentComplete,
          createdById: userId,
          parentId, // Set parent based on outline number
          assignedToId, // Set assignee from resource mapping
          assigneeName, // Store resource name when no portal user matched
          order: taskOrder, // Use sequential order from hierarchically sorted tasks
        },
      });

      taskOrder++; // Increment order for next task

      taskUidToIdMap.set(parsedTask.uid, task.id);
      
      // Store task ID by outline number for parent linking
      if (parsedTask.outlineNumber) {
        outlineNumberToIdMap.set(parsedTask.outlineNumber, task.id);
        console.log(`  ✓ Stored in map: "${parsedTask.outlineNumber}" -> ${task.id}`);
      } else {
        console.log(`  ⚠️  Not stored in outline map (no outline number)`);
      }
      
      console.log(`  ✓ Created task with ID: ${task.id}, Parent: ${parentId || 'NULL'}`);

      // Store dependencies for second pass
      if (parsedTask.predecessors && parsedTask.predecessors.length > 0) {
        for (const predUid of parsedTask.predecessors) {
          taskDependencies.push({
            taskId: task.id,
            dependsOnId: predUid, // Will be resolved to actual ID in second pass
          });
        }
      }
    }

    // Second pass: Create task dependencies
    for (const dep of taskDependencies) {
      const dependsOnId = taskUidToIdMap.get(dep.dependsOnId);
      if (dependsOnId) {
        await prisma.taskDependency.create({
          data: {
            taskId: dep.taskId,
            dependsOnId,
            type: 'FS', // Finish to Start
          },
        });
      }
    }

    // Third pass: Recalculate parent task progress based on subtasks
    // Get all tasks with children (parents)
    console.log('\n=== MPP IMPORT: Recalculating Parent Progress ===');
    const allImportedTasks = Array.from(taskUidToIdMap.values());
    const tasksWithParents = new Set<string>();
    
    for (const taskId of allImportedTasks) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { parentId: true },
      });
      if (task?.parentId) {
        tasksWithParents.add(task.parentId);
      }
    }

    console.log(`Found ${tasksWithParents.size} parent tasks to recalculate`);
    
    // Recalculate each parent (this will cascade up the hierarchy)
    for (const parentId of tasksWithParents) {
      // Get any child of this parent to trigger the update
      const child = await prisma.task.findFirst({
        where: { parentId },
        select: { id: true },
      });
      
      if (child) {
        await updateParentProgress(child.id);
      }
    }
    
    console.log('Parent progress recalculation complete\n');

    // Update project dates if needed
    if (parsedData.startDate && parsedData.finishDate) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          startDate: new Date(parsedData.startDate),
          endDate: new Date(parsedData.finishDate),
        },
      });
    }

    console.log('\n=== MPP IMPORT: Summary ===');
    console.log(`Tasks created: ${taskUidToIdMap.size}`);
    console.log(`Dependencies created: ${taskDependencies.filter(dep => taskUidToIdMap.has(dep.dependsOnId)).length}`);
    console.log(`Outline map final size: ${outlineNumberToIdMap.size}`);
    console.log('Outline map contents:', Array.from(outlineNumberToIdMap.entries()));
    console.log('=== END ===\n');

    res.json({
      status: 'success',
      data: {
        message: 'MPP file imported successfully',
        tasksCreated: taskUidToIdMap.size,
        dependenciesCreated: taskDependencies.filter(dep => 
          taskUidToIdMap.has(dep.dependsOnId)
        ).length,
        resourcesFound: parsedData.resources.length,
        resourcesMatched: resourceUidToUserIdMap.size,
        unmatchedResources: unmatchedResources.length > 0 ? unmatchedResources : undefined,
        assignmentsCreated: Array.from(taskUidToAssigneeMap.values()).length,
      },
    });
  } catch (error) {
    next(error);
  }
};
