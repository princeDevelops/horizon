import { TaskPriority, TaskStatus, Tag } from '../types';

export type TaskSortBy =
  | 'createdAt'
  | 'updatedAt'
  | 'dueDate'
  | 'startDate'
  | 'priority'
  | 'status'
  | 'title';

export type SortOrder = 'asc' | 'desc';

/**
 * All date fields are expected as ISO 8601 strings.
 * Semantics: *From = inclusive lower bound, *To = inclusive upper bound.
 */
export interface GetTasksQuery {
  // status/priority can be single or multi-select
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];

  // flags (tri‑state: true/false/undefined)
  isArchived?: boolean;
  isPinned?: boolean;

  // tags can be single or multi
  tags?: Tag | Tag[];
  customTags?: string | string[];

  // free-text search
  search?: string;

  // date range filters (inclusive)
  dueFrom?: string;
  dueTo?: string;
  startFrom?: string;
  startTo?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  finishedFrom?: string;
  finishedTo?: string;

  // sorting
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
  /**
   * Optional raw sort input like "dueDate:desc"; server can normalize to sortBy/sortOrder.
   */
  sort?: string;

  // optional explicit set of IDs to fetch
  id?: string;
  ids?: string | string[];

  // pagination ( page=1, limit=10 by default )
  page?: number;
  limit?: number;
}
