/**
 * ═══════════════════════════════════════════════════════════════════
 * THESIS HUB — Centralized API Endpoints Configuration
 * ═══════════════════════════════════════════════════════════════════
 *
 * ALL backend API paths are defined here in ONE place.
 * When the Spring Boot backend endpoints are finalized,
 * update ONLY this file — no need to hunt through api.ts.
 *
 * Convention (Spring Boot REST):
 *   - No trailing slashes
 *   - Plural nouns for collections: /students, /projects
 *   - kebab-case for multi-word: /group-requests, /change-password
 *   - Nested resources: /groups/:id/comments
 */

// ─── Authentication ───────────────────────────────────────────────
export const AUTH = {
  LOGIN:                   '/auth/login',
  ADMIN_REGISTER:          '/auth/admin/register',
  ADMIN_LOGIN:             '/auth/admin/login',
  STUDENT_LOGIN:           '/auth/students/login',
  SUPERVISOR_LOGIN:        '/auth/supervisors/login',
  COMMITTEE_MEMBER_LOGIN:  '/auth/committee-members/login',
  EXTERNAL_LOGIN:          '/auth/externals/login',
  TOKEN_REFRESH:           '/auth/refresh',
  LOGOUT:                  '/auth/logout',
  CHANGE_PASSWORD:         '/auth/change-password',
  WS_TICKET:               '/auth/ws-ticket',
} as const;

// ─── Students ─────────────────────────────────────────────────────
export const STUDENTS = {
  PROFILE:                 '/students/profile',
  LIST:                    '/students',
  EXTERNAL_EVALUATION:     '/students/external-evaluation',
} as const;

// ─── Supervisors ──────────────────────────────────────────────────
export const SUPERVISORS = {
  PROFILE:                 '/supervisors/profile',
  LIST:                    '/supervisors',
  ANALYTICS:               '/supervisors/analytics',
  DOCUMENTS:               '/supervisors/documents',
} as const;

// ─── Committee Members ───────────────────────────────────────────
export const COMMITTEE_MEMBERS = {
  PROFILE:                 '/committee-members/profile',
  GROUPS:                  '/committee-members/groups',
  ANALYTICS:               '/committee-members/analytics',
} as const;

// ─── Groups ───────────────────────────────────────────────────────
export const GROUPS = {
  REQUESTS:                '/groups/requests',
  request:          (id: number) => `/groups/requests/${id}` as const,
  detail:           (id: number) => `/groups/${id}` as const,
  comments:         (groupId: number) => `/groups/${groupId}/comments` as const,
} as const;

// ─── Supervisor-Student Relationships ─────────────────────────────
export const SUPERVISOR_STUDENT = {
  REQUESTS:                '/supervisor-student/requests',
  RESPONSE:                '/supervisor-student/response',
  COMMENTS:                '/supervisor-student/comments',
  request:          (id: number) => `/supervisor-student/${id}` as const,
} as const;

// ─── Projects ─────────────────────────────────────────────────────
export const PROJECTS = {
  LIST:                    '/projects',
  CATEGORIES:              '/projects/categories',
  detail:           (id: number) => `/projects/${id}` as const,
} as const;

// ─── Documents ────────────────────────────────────────────────────
export const DOCUMENTS = {
  REQUIREMENTS:            '/documents/requirements',
  list:             (type: string) => `/documents/${type}` as const,
  detail:           (type: string, id: number) => `/documents/${type}/${id}` as const,
  submitToCommittee:(type: string, id: number) => `/documents/${type}/${id}/submit-to-committee` as const,
  requirement:      (id: number) => `/documents/requirements/${id}` as const,
} as const;

// ─── Evaluations ──────────────────────────────────────────────────
export const EVALUATIONS = {
  scopeDocument:    (groupId: number) => `/evaluations/scope-document/${groupId}` as const,
  srsSupervisor:    (groupId: number) => `/evaluations/srs-supervisor/${groupId}` as const,
  srsCommittee:     (groupId: number) => `/evaluations/srs-committee/${groupId}` as const,
  sddSupervisor:    (groupId: number) => `/evaluations/sdd-supervisor/${groupId}` as const,
  sddCommittee:     (groupId: number) => `/evaluations/sdd-committee/${groupId}` as const,
  eval3Supervisor:  (groupId: number) => `/evaluations/eval3-supervisor/${groupId}` as const,
  eval3Committee:   (groupId: number) => `/evaluations/eval3-committee/${groupId}` as const,
  eval4Supervisor:  (groupId: number) => `/evaluations/eval4-supervisor/${groupId}` as const,
  eval4Committee:   (groupId: number) => `/evaluations/eval4-committee/${groupId}` as const,
} as const;

// ─── Chat ─────────────────────────────────────────────────────────
export const CHAT = {
  MESSAGES:                '/chat/messages',
  message:          (id: number) => `/chat/messages/${id}` as const,
} as const;

// ─── Templates ────────────────────────────────────────────────────
export const TEMPLATES = {
  list:             (type: string) => `/templates/${type}` as const,
} as const;

// ─── Notifications ────────────────────────────────────────────────
export const NOTIFICATIONS = {
  LIST:                    '/notifications',
  UNREAD_COUNT:            '/notifications/unread-count',
  MARK_READ:               '/notifications/mark-read',
  DELETE_ALL:              '/notifications/delete-all',
  PREFERENCES:             '/notifications/preferences',
  detail:           (id: number) => `/notifications/${id}` as const,
} as const;

// ─── Audit Logs ───────────────────────────────────────────────────
export const AUDIT_LOGS = {
  LIST:                    '/audit-logs',
  STATS:                   '/audit-logs/stats',
  byGroup:          (groupId: number) => `/audit-logs/group/${groupId}` as const,
} as const;

// ─── External Examiner ───────────────────────────────────────────
export const EXTERNAL = {
  PROFILE:                 '/external/profile',
  DASHBOARD:               '/external/dashboard',
  EXAMINERS:               '/external/examiners',
  GROUPS:                  '/external/groups',
  ASSIGNMENTS:             '/external/assignments',
  AVAILABLE_GROUPS:        '/external/available-groups',
  EVALUATIONS:             '/external/evaluations',
  EVALUATIONS_CREATE:      '/external/evaluations/create',
  group:            (id: number) => `/external/groups/${id}` as const,
  groupStudents:    (groupId: number) => `/external/groups/${groupId}/students` as const,
  evaluation:       (id: number) => `/external/evaluations/${id}` as const,
  assignment:       (id: number) => `/external/assignments/${id}` as const,
} as const;

// ─── Schedules ────────────────────────────────────────────────────
export const SCHEDULES = {
  LIST:                    '/schedules',
  detail:           (id: number) => `/schedules/${id}` as const,
} as const;

// ─── Export ───────────────────────────────────────────────────────
export const EXPORT = {
  REPORT:                  '/export/report',
  CONSOLIDATED_REPORT:     '/export/consolidated-report',
} as const;

// ─── Organization & Academic Master Data ──────────────────────────
export const ORGANIZATION = {
  FACULTIES:               '/faculties',
  faculty:          (id: number) => `/faculties/${id}` as const,
  facultyDepartments: (id: number) => `/faculties/${id}/departments` as const,
  DEPARTMENTS:             '/departments',
  department:       (id: number) => `/departments/${id}` as const,
  MAJORS:                  '/majors',
  major:            (id: number) => `/majors/${id}` as const,
  TRAINING_PROGRAMS:       '/training-programs',
  trainingProgram:  (id: number) => `/training-programs/${id}` as const,
  LECTURERS:               '/lecturers',
  lecturer:         (id: number) => `/lecturers/${id}` as const,
  STUDENTS:                '/students',
  student:          (id: number) => `/students/${id}` as const,
} as const;

// ─── Project Rounds & Timelines (Contract 2 & Contract 3) ─────────
export const PROJECT_ROUNDS = {
  LIST:                    '/project-rounds',
  ACTIVE:                  '/project-rounds/active',
  STUDENT_TEMPLATE:        '/project-rounds/students/template',
  detail:           (id: number) => `/project-rounds/${id}` as const,
  status:           (id: number) => `/project-rounds/${id}/status` as const,
  currentMilestone: (id: number) => `/project-rounds/${id}/current-milestone` as const,
  milestones:       (roundId: number) => `/project-rounds/${roundId}/milestones` as const,
  milestoneDetail:  (milestoneId: number) => `/timeline-milestones/${milestoneId}` as const,
  students:         (roundId: number) => `/project-rounds/${roundId}/students` as const,
  studentDetail:    (roundId: number, studentId: number) => `/project-rounds/${roundId}/students/${studentId}` as const,
  studentStatus:    (roundId: number, studentId: number) => `/project-rounds/${roundId}/students/${studentId}/status` as const,
  studentImportPreview: (roundId: number) => `/project-rounds/${roundId}/students/import-preview` as const,
  studentImportCommit:  (roundId: number) => `/project-rounds/${roundId}/students/import-commit` as const,
  studentManual:        (roundId: number) => `/project-rounds/${roundId}/students/manual` as const,
  studentCheckEligibility: (roundId: number) => `/project-rounds/${roundId}/students/check-eligibility` as const,
  advancePhase:         (roundId: number) => `/project-rounds/${roundId}/advance-phase` as const,
  advanceActivePhase:   '/project-rounds/active/advance-phase',
} as const;

// ─── Academic Records (Contract 4) ────────────────────────────────
export const ACADEMIC_RECORDS = {
  TEMPLATE:                '/project-rounds/academic-records/template',
  roundRecords:     (roundId: number) => `/project-rounds/${roundId}/academic-records` as const,
  manual:           (roundId: number) => `/project-rounds/${roundId}/academic-records/manual` as const,
  studentInRound:   (roundId: number, studentId: number) => `/project-rounds/${roundId}/academic-records/${studentId}` as const,
  importPreview:    (roundId: number) => `/project-rounds/${roundId}/academic-records/import-preview` as const,
  importCommit:     (roundId: number) => `/project-rounds/${roundId}/academic-records/import-commit` as const,
  studentLatest:    (studentId: number) => `/academic-records/student/${studentId}` as const,
} as const;
