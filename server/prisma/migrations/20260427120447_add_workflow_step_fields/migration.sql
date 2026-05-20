-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CaseStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseId" INTEGER NOT NULL,
    "stepId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" DATETIME,
    CONSTRAINT "CaseStep_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseStep_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowStep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CaseStep" ("caseId", "completedAt", "id", "status", "stepId") SELECT "caseId", "completedAt", "id", "status", "stepId" FROM "CaseStep";
DROP TABLE "CaseStep";
ALTER TABLE "new_CaseStep" RENAME TO "CaseStep";
CREATE TABLE "new_WorkflowStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_WorkflowStep" ("description", "id", "name", "order", "type") SELECT "description", "id", "name", "order", "type" FROM "WorkflowStep";
DROP TABLE "WorkflowStep";
ALTER TABLE "new_WorkflowStep" RENAME TO "WorkflowStep";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
