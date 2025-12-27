/**
 * Application Constants
 */

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUB_ADMIN: 'subAdmin',
  TEACHER: 'teacher',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Lesson Types
export const LESSON_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group',
} as const;

export type LessonType = typeof LESSON_TYPES[keyof typeof LESSON_TYPES];

// Education Levels (Arabic names)
export const EDUCATION_LEVELS = {
  ELEMENTARY: 'ابتدائي',
  MIDDLE: 'إعدادي',
  SECONDARY: 'ثانوي',
} as const;

// Approval Status
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    CHANGE_PASSWORD: '/api/auth/change-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    PROFILE: '/api/profile',
  },
  TEACHERS: {
    BASE: '/api/teachers',
    BY_ID: (id: number) => `/api/teachers/${id}`,
    STATS: (id: number) => `/api/teachers/${id}/stats`,
  },
  STUDENTS: {
    BASE: '/api/students',
    BY_ID: (id: number) => `/api/students/${id}`,
    STATS: (id: number) => `/api/students/${id}/stats`,
    PAYMENTS: (id: number) => `/api/students/${id}/payments`,
  },
  LESSONS: {
    INDIVIDUAL: {
      BASE: '/api/lessons/individual',
      BY_ID: (id: number) => `/api/lessons/individual/${id}`,
      APPROVE: (id: number) => `/api/lessons/individual/${id}/approve`,
      BULK_APPROVE: '/api/lessons/individual/bulk-approve',
    },
    GROUP: {
      BASE: '/api/lessons/group',
      BY_ID: (id: number) => `/api/lessons/group/${id}`,
      APPROVE: (id: number) => `/api/lessons/group/${id}/approve`,
      BULK_APPROVE: '/api/lessons/group/bulk-approve',
    },
    REMEDIAL: {
      BASE: '/api/lessons/remedial',
      BY_ID: (id: number) => `/api/lessons/remedial/${id}`,
      APPROVE: (id: number) => `/api/lessons/remedial/${id}/approve`,
    },
  },
  PAYMENTS: {
    BASE: '/api/payments',
    BY_ID: (id: number) => `/api/payments/${id}`,
  },
  PRICING: {
    BASE: '/api/pricing',
    BY_ID: (id: number) => `/api/pricing/${id}`,
  },
  GROUP_PRICING_TIERS: {
    BASE: '/api/group-pricing-tiers',
  },
  STATISTICS: {
    BASE: '/api/statistics',
    TEACHER: '/api/statistics/teacher',
    STUDENT: '/api/statistics/student',
    LEVEL: '/api/statistics/level',
    GLOBAL: '/api/statistics/global',
  },
  REPORTS: {
    EXPORT_PDF: '/api/reports/export-pdf',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

