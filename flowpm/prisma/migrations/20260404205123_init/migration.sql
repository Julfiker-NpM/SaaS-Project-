-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'free'
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrgMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "invited_at" DATETIME,
    "joined_at" DATETIME,
    CONSTRAINT "OrgMember_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrgMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "logo_url" TEXT,
    "portal_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "client_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "color" TEXT NOT NULL DEFAULT '#534AB7',
    "due_date" DATETIME,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_date" DATETIME,
    "estimated_hours" REAL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskComment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT,
    "hours" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeEntry_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "client_id" TEXT,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_amount" REAL NOT NULL,
    "due_date" DATETIME,
    "sent_at" DATETIME,
    "paid_at" DATETIME,
    CONSTRAINT "Invoice_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "OrgMember_org_id_idx" ON "OrgMember"("org_id");

-- CreateIndex
CREATE INDEX "OrgMember_user_id_idx" ON "OrgMember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMember_org_id_user_id_key" ON "OrgMember"("org_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_portal_token_key" ON "Client"("portal_token");

-- CreateIndex
CREATE INDEX "Client_org_id_idx" ON "Client"("org_id");

-- CreateIndex
CREATE INDEX "Project_org_id_idx" ON "Project"("org_id");

-- CreateIndex
CREATE INDEX "Project_client_id_idx" ON "Project"("client_id");

-- CreateIndex
CREATE INDEX "Task_project_id_idx" ON "Task"("project_id");

-- CreateIndex
CREATE INDEX "Task_assignee_id_idx" ON "Task"("assignee_id");

-- CreateIndex
CREATE INDEX "TaskComment_task_id_idx" ON "TaskComment"("task_id");

-- CreateIndex
CREATE INDEX "TimeEntry_project_id_idx" ON "TimeEntry"("project_id");

-- CreateIndex
CREATE INDEX "TimeEntry_user_id_idx" ON "TimeEntry"("user_id");

-- CreateIndex
CREATE INDEX "Invoice_org_id_idx" ON "Invoice"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_org_id_number_key" ON "Invoice"("org_id", "number");
