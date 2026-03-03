import { TaskPriority, TaskStatus, Tag } from '../types';

/** Fields that can be used in task list sorting. */
export type TaskSortBy =
  | 'createdAt'
  | 'updatedAt'
  | 'dueDate'
  | 'startDate'
  | 'priority'
  | 'status'
  | 'title';

/** Direction for task list sorting. */
export type SortOrder = 'asc' | 'desc';

/**
 * Query model for task listing endpoints.
 * Date fields expect ISO 8601 strings; `*From`/`*To` are inclusive bounds.
 */
export interface GetTasksQuery {
  /** Single or multi-select status filter. */
  status?: TaskStatus | TaskStatus[];
  /** Single or multi-select priority filter. */
  priority?: TaskPriority | TaskPriority[];

  /** Optional archive flag filter. */
  isArchived?: boolean;
  /** Optional pin flag filter. */
  isPinned?: boolean;

  /** Single or multi-select predefined tag filter. */
  tags?: Tag | Tag[];
  /** Single or multi-select custom tag filter. */
  customTags?: string | string[];

  /** Case-insensitive free-text search across indexed fields. */
  search?: string;

  /** Inclusive due date lower bound. */
  dueFrom?: string;
  /** Inclusive due date upper bound. */
  dueTo?: string;
  /** Inclusive start date lower bound. */
  startFrom?: string;
  /** Inclusive start date upper bound. */
  startTo?: string;
  /** Inclusive created date lower bound. */
  createdFrom?: string;
  /** Inclusive created date upper bound. */
  createdTo?: string;
  /** Inclusive updated date lower bound. */
  updatedFrom?: string;
  /** Inclusive updated date upper bound. */
  updatedTo?: string;
  /** Inclusive finished date lower bound. */
  finishedFrom?: string;
  /** Inclusive finished date upper bound. */
  finishedTo?: string;

  /** Field-based sort key. */
  sortBy?: TaskSortBy;
  /** Sort direction. */
  sortOrder?: SortOrder;
  /**
   * Optional raw sort input, e.g. `dueDate:desc`.
   */
  sort?: string;

  /** Optional single task id filter. */
  id?: string;
  /** Optional multi-id filter. */
  ids?: string | string[];

  /** 1-based page number. */
  page?: number;
  /** Page size. */
  limit?: number;
}
