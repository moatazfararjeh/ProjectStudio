-- Create system_settings table
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_category_key_key" ON "system_settings"("category", "key");

-- Insert default settings
-- Project Member Roles
INSERT INTO "system_settings" ("id", "category", "key", "labelEn", "labelAr", "color", "order", "isActive", "isSystem")
VALUES 
    (gen_random_uuid()::text, 'project_member_role', 'MANAGER', 'Project Manager', 'مدير المشروع', 'blue', 1, true, true),
    (gen_random_uuid()::text, 'project_member_role', 'TEAM_LEAD', 'Team Lead', 'قائد الفريق', 'cyan', 2, true, true),
    (gen_random_uuid()::text, 'project_member_role', 'DEVELOPER', 'Developer', 'مطور', 'green', 3, true, false),
    (gen_random_uuid()::text, 'project_member_role', 'DESIGNER', 'Designer', 'مصمم', 'purple', 4, true, false),
    (gen_random_uuid()::text, 'project_member_role', 'QA', 'QA Engineer', 'مهندس ضمان جودة', 'orange', 5, true, false),
    (gen_random_uuid()::text, 'project_member_role', 'MEMBER', 'Team Member', 'عضو فريق', 'default', 6, true, false)
ON CONFLICT ("category", "key") DO NOTHING;

-- Project Status
INSERT INTO "system_settings" ("id", "category", "key", "labelEn", "labelAr", "color", "order", "isActive", "isSystem")
VALUES 
    (gen_random_uuid()::text, 'project_status', 'PLANNING', 'Planning', 'تخطيط', 'blue', 1, true, true),
    (gen_random_uuid()::text, 'project_status', 'IN_PROGRESS', 'In Progress', 'قيد التنفيذ', 'cyan', 2, true, true),
    (gen_random_uuid()::text, 'project_status', 'ON_HOLD', 'On Hold', 'معلق', 'orange', 3, true, false),
    (gen_random_uuid()::text, 'project_status', 'COMPLETED', 'Completed', 'مكتمل', 'green', 4, true, true),
    (gen_random_uuid()::text, 'project_status', 'CANCELLED', 'Cancelled', 'ملغي', 'red', 5, true, false)
ON CONFLICT ("category", "key") DO NOTHING;

-- Task Priority
INSERT INTO "system_settings" ("id", "category", "key", "labelEn", "labelAr", "color", "order", "isActive", "isSystem")
VALUES 
    (gen_random_uuid()::text, 'task_priority', 'LOW', 'Low', 'منخفض', 'default', 1, true, false),
    (gen_random_uuid()::text, 'task_priority', 'MEDIUM', 'Medium', 'متوسط', 'blue', 2, true, false),
    (gen_random_uuid()::text, 'task_priority', 'HIGH', 'High', 'عالي', 'orange', 3, true, false),
    (gen_random_uuid()::text, 'task_priority', 'CRITICAL', 'Critical', 'حرج', 'red', 4, true, false)
ON CONFLICT ("category", "key") DO NOTHING;

-- Task Status
INSERT INTO "system_settings" ("id", "category", "key", "labelEn", "labelAr", "color", "order", "isActive", "isSystem")
VALUES 
    (gen_random_uuid()::text, 'task_status', 'NOT_STARTED', 'Not Started', 'لم تبدأ', 'default', 1, true, false),
    (gen_random_uuid()::text, 'task_status', 'IN_PROGRESS', 'In Progress', 'قيد التنفيذ', 'blue', 2, true, false),
    (gen_random_uuid()::text, 'task_status', 'REVIEW', 'In Review', 'قيد المراجعة', 'orange', 3, true, false),
    (gen_random_uuid()::text, 'task_status', 'COMPLETED', 'Completed', 'مكتملة', 'green', 4, true, false),
    (gen_random_uuid()::text, 'task_status', 'BLOCKED', 'Blocked', 'محظورة', 'red', 5, true, false)
ON CONFLICT ("category", "key") DO NOTHING;

-- RAID Priority
INSERT INTO "system_settings" ("id", "category", "key", "labelEn", "labelAr", "color", "order", "isActive", "isSystem")
VALUES 
    (gen_random_uuid()::text, 'raid_priority', 'LOW', 'Low', 'منخفض', 'default', 1, true, false),
    (gen_random_uuid()::text, 'raid_priority', 'MEDIUM', 'Medium', 'متوسط', 'blue', 2, true, false),
    (gen_random_uuid()::text, 'raid_priority', 'HIGH', 'High', 'عالي', 'orange', 3, true, false),
    (gen_random_uuid()::text, 'raid_priority', 'CRITICAL', 'Critical', 'حرج', 'red', 4, true, false)
ON CONFLICT ("category", "key") DO NOTHING;
