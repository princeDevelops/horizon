import {
  GetTasksQuery,
  SortOrder,
  Tag,
  TaskPriority,
  TaskSortBy,
  TaskStatus,
} from '@horizon/shared';
import type { Filter } from 'mongodb';
import { Types } from 'mongoose';
import type { TaskDocument } from '../api/models/task.model';

type StringOrArray = string | string[] | undefined;
type TaskFilter = Filter<TaskDocument>;

export class TaskFilters {
  private filter: TaskFilter = {};
  private sort?: Record<TaskSortBy, SortOrder>;
  private page = 1;
  private limit = 5;

  /** Builds normalized filter, sort and pagination config from raw query input. */
  constructor(private readonly input: GetTasksQuery) {
    this.build();
  }

  /** Returns MongoDB filter object derived from query input. */
  public getFilter() {
    return this.filter;
  }

  /** Returns normalized sort descriptor if provided. */
  public getSort() {
    return this.sort;
  }

  /** Returns normalized pagination values. */
  public getPagination() {
    return { page: this.page, limit: this.limit };
  }

  /** Runs all filter/sort/pagination transformation steps. */
  private build() {
    this.applyStatus();
    this.applyPriority();
    this.applyFlags();
    this.applyTags();
    this.applySearch();
    this.applyDates();
    this.applyIds();
    this.applySort();
    this.applyPagination();
  }

  /** Normalizes a value that may be scalar or array into an array. */
  private toArray(value: StringOrArray) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  /** Parses booleans from query input (`true`/`false`) with tri-state semantics. */
  private toBool(value: unknown) {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';

    return undefined;
  }

  /** Adds an inclusive date range clause to the filter for a given field. */
  private addDateRange(
    field: Extract<keyof TaskDocument, string>,
    from?: string,
    to?: string
  ) {
    if (!from && !to) {
      return;
    }

    const range: { $gte?: Date; $lte?: Date } = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);

    (this.filter as Record<string, unknown>)[field] = range;
  }

  /** Applies status filter. */
  private applyStatus() {
    const statuses = this.toArray(this.input.status) as TaskStatus[];
    if (statuses.length) {
      this.filter.status = { $in: statuses };
    }
  }

  /** Applies priority filter. */
  private applyPriority() {
    const priorities = this.toArray(this.input.priority) as TaskPriority[];
    if (priorities.length) this.filter.priority = { $in: priorities };
  }

  /** Applies archive and pin flag filters. */
  private applyFlags() {
    const archived = this.toBool(this.input.isArchived);
    if (archived !== undefined) this.filter.isArchived = archived;

    const pinned = this.toBool(this.input.isPinned);
    if (pinned !== undefined) this.filter.isPinned = pinned;
  }

  /** Applies predefined and custom tag filters. */
  private applyTags() {
    const tags = this.toArray(this.input.tags) as Tag[];
    if (tags.length) this.filter.tags = { $in: tags };

    const customTags = this.toArray(this.input.customTags);
    if (customTags.length) this.filter.customTags = { $in: customTags };
  }

  /** Applies escaped case-insensitive text search across title/description. */
  private applySearch() {
    const search = this.input.search?.trim();
    if (!search) return;

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearch, 'i');
    this.filter.$or = [{ title: regex }, { description: regex }];
  }

  /** Applies supported date range filters. */
  private applyDates() {
    this.addDateRange('dueDate', this.input.dueFrom, this.input.dueTo);
    this.addDateRange('startDate', this.input.startFrom, this.input.startTo);
    this.addDateRange(
      'createdAt',
      this.input.createdFrom,
      this.input.createdTo
    );
    this.addDateRange(
      'updatedAt',
      this.input.updatedFrom,
      this.input.updatedTo
    );
    this.addDateRange(
      'finishedAt',
      this.input.finishedFrom,
      this.input.finishedTo
    );
  }

  /** Applies id/id list filtering and guards against invalid-only id sets. */
  private applyIds() {
    const rawIds = [
      ...(this.input.id ? [this.input.id] : []),
      ...this.toArray(this.input.ids as StringOrArray),
    ];

    const ids = rawIds
      .filter((id) => typeof id === 'string' && Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (ids.length) {
      this.filter._id = { $in: ids };
    } else if (rawIds.length) {
      this.filter._id = { $in: [] };
    }
  }

  /** Applies sort configuration from structured or raw sort input. */
  private applySort() {
    if (this.input.sortBy) {
      this.sort = {
        [this.input.sortBy]: this.input.sortOrder ?? 'asc',
      } as Record<TaskSortBy, SortOrder>;
      return;
    }

    if (this.input.sort) {
      const [field, dir] = this.input.sort.split(':');
      this.sort = {
        [field.trim() as TaskSortBy]:
          dir?.toLowerCase() === 'desc' ? 'desc' : 'asc',
      } as Record<TaskSortBy, SortOrder>;
    }
  }

  /** Applies pagination defaults and upper limit guard. */
  private applyPagination() {
    this.page = Math.max(1, Number(this.input.page) || 1);
    this.limit = Math.min(100, Math.max(1, Number(this.input.limit) || 5));
  }
}
