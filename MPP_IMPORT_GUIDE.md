# MPP Import Feature - User Guide

## Overview
The MPP Import feature allows you to upload Microsoft Project plan files (.mpp or .xml) and automatically populate tasks in your EPM project. This feature saves time by importing your existing project plans directly into the system.

## How to Use

### Step 1: Export from Microsoft Project
Since binary .mpp files are complex to parse, you need to export your MS Project file to XML format:

1. Open your project in Microsoft Project
2. Go to **File → Save As**
3. Choose **XML Format (*.xml)** from the file type dropdown
4. Save the file

### Step 2: Import into EPM

1. Navigate to your project in EPM
2. Go to the **Tasks** tab
3. Click the **"Import MPP"** button (next to the "New Task" button)
4. In the modal dialog:
   - Click **"Select MPP/XML File"**
   - Choose the XML file you exported
   - Click **"OK"** to start the import

### Step 3: Review Imported Tasks

After successful import, you'll see:
- A success message showing the number of tasks created
- The number of task dependencies created
- All tasks will appear in the tasks table

## What Gets Imported

The import process extracts the following information from your MS Project file:

### Task Properties
- **Task Name**: Imported as-is
- **Start Date**: Task start date
- **End Date**: Task finish date  
- **Duration**: Automatically converted from MS Project duration format to days
  - Supports ISO 8601 duration formats:
    - **PT8H** = 8 hours = 1 day (based on project settings)
    - **P1D** = 1 day
    - **P1W** = 1 week = 5 working days
    - **PT8H30M** = 8.5 hours
    - **P2DT4H** = 2 days + 4 hours = 2.5 days
  - Uses project-specific hours per day from settings (default: 8)
- **Planned Hours**: Duration × hours per day (from project settings)
- **Progress**: Percent complete (0-100%)
- **Priority**: Mapped from MS Project priority scale:
  - 800+ → CRITICAL
  - 600-799 → HIGH
  - 400-599 → MEDIUM
  - <400 → LOW
- **Status**: Derived from percent complete:
  - 0% → NOT_STARTED
  - 1-99% → IN_PROGRESS
  - 100% → COMPLETED
- **Notes/Description**: Task notes from MS Project
- **Task Hierarchy**: Parent-child relationships preserved based on outline levels
  - OutlineLevel 1 → Main tasks (no parent)
  - OutlineLevel 2 → Subtasks of level 1 tasks
  - OutlineLevel 3+ → Nested subtasks

### Task Dependencies
- **Finish-to-Start** dependencies are imported
- Dependencies are created based on predecessor links in MS Project

### Task Hierarchy
The import preserves the work breakdown structure (WBS) from MS Project:
- Tasks are organized in parent-child relationships using **OutlineNumber** field
- Each task has an outline number (e.g., "1.1.1.1.1") that defines its position in the hierarchy
- Parent tasks are determined by removing the last segment:
  - Task "1.1.1.1.1" → Parent is "1.1.1.1"
  - Task "1.1" → Parent is "1"
  - Task "1" → No parent (top level)
- Outline levels (OutlineLevel field) provide additional hierarchy context
- Subtasks are automatically linked to their parent tasks
- The visual hierarchy is displayed with tree structure in table view
- Deep hierarchies (5+ levels) are fully supported with expand/collapse functionality

### Project Dates
- Project start and end dates are updated to match the MS Project plan

## Technical Details

### Backend Implementation

#### Files Created/Modified:
1. **`server/src/utils/mppParser.ts`** - Parser utility for MS Project XML files
   - Parses XML structure
   - Extracts tasks with outline numbers and levels
   - Extracts task dependencies
   - Maps MS Project fields to EPM fields
   - **`mapDuration()`** - Converts ISO 8601 duration to days
     - Handles weeks (P1W → 5 days)
     - Handles days (P2D → 2 days)
     - Handles hours (PT8H → 1 day based on hours/day)
     - Handles minutes (PT30M → 0.0625 days)
     - Handles combinations (P2DT4H → 2.5 days)
     - Uses project-specific hours per day setting
   - **`mapPriority()`** - Converts MS Project priority to EPM priority
   - **`mapStatus()`** - Converts percent complete to task status
   - **`getParentOutlineNumber()`** - Extracts parent outline number from task outline number
     - "1.1.1.1.1" → "1.1.1.1"
     - "1.1" → "1"
     - "1" → undefined (top level)

2. **`server/src/middleware/upload.ts`** - Multer middleware for file uploads
   - Handles file upload with 10MB size limit
   - Accepts .xml and .mpp files
   - Uses memory storage for processing

3. **`server/src/controllers/task.controller.ts`** - Added `importMPP` function
   - Validates project access
   - Parses uploaded file
   - Creates tasks in database with parent-child relationships
   - Uses **OutlineNumber** field to determine parent tasks
   - Maps outline numbers to database IDs for parent linking
   - Establishes task dependencies
   - Updates project dates

4. **`server/src/routes/task.routes.ts`** - Added import endpoint
   - Route: `POST /api/tasks/import-mpp`
   - Requires authentication
   - Uses multer upload middleware

### Frontend Implementation

#### Files Modified:
1. **`client/src/lib/api.ts`** - Added `importMPP` API method
   - Sends file via FormData
   - Includes projectId
   - Returns import statistics

2. **`client/src/pages/projects/ProjectTasks.tsx`** - Added import UI
   - "Import MPP" button in tasks tab
   - Upload modal with file selector
   - Success/error messaging
   - Auto-refresh tasks after import

### Dependencies Added:
```json
{
  "multer": "^1.4.x",
  "@types/multer": "^1.4.x",
  "xml2js": "^0.x",
  "@types/xml2js": "^0.x"
}
```

## API Endpoint

### Import MPP File
```
POST /api/tasks/import-mpp
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: XML file (required)
- projectId: Project UUID (required)

Response:
{
  "status": "success",
  "data": {
    "message": "MPP file imported successfully",
    "tasksCreated": 25,
    "dependenciesCreated": 18
  }
}
```

## Limitations

1. **File Format**: Only XML exports from MS Project are supported. Binary .mpp files should be exported to XML first.

2. **Task Assignments**: Assignees are not imported automatically. You'll need to assign team members to tasks after import.

3. **Resources**: Resource information from MS Project is not imported.

4. **Custom Fields**: Only standard MS Project fields are imported.

5. **Summary Tasks**: Top-level summary tasks (outline level 0) are skipped if there are other tasks.

6. **Dependency Types**: Only Finish-to-Start dependencies are supported. Other types (Start-to-Start, Finish-to-Finish, Start-to-Finish) are not imported.

## Troubleshooting

### "Failed to parse MS Project file"
- Ensure you exported to XML format, not binary .mpp
- Check that the XML file is valid and not corrupted
- Try exporting again from MS Project

### "No file uploaded"
- Make sure you selected a file before clicking OK
- Check file size is under 10MB

### "You do not have access to this project"
- Verify you are a member or manager of the project
- Contact the project manager for access

### Tasks imported but no dependencies
- Check that predecessor links were set in MS Project
- Verify the task UIDs are present in the XML export

## Best Practices

1. **Review Before Import**: Check your MS Project plan is complete before exporting

2. **Clean Up Data**: Remove unnecessary summary tasks or milestones if not needed

3. **Backup**: Consider exporting existing tasks before importing to avoid data loss

4. **Test First**: Try importing on a test project first to verify the structure

5. **Assign Later**: Import the structure first, then assign team members to tasks

## Future Enhancements

Potential improvements for future versions:
- Support for binary .mpp files
- Resource/assignment import
- Custom field mapping
- Baseline data import
- Two-way sync with MS Project
- Import validation preview before commit
