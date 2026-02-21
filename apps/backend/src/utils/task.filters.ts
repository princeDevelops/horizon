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
import { TaskDocument } from '../api/models/task.model';

type StringOrArray = string | string[] | undefined;
type TaskFilter = Filter<TaskDocument>;

export class TaskFilters {
  private filter: TaskFilter = {};
  private sort?: Record<TaskSortBy, SortOrder>;
  private page = 1;
  private limit = 5;

  constructor(private readonly input: GetTasksQuery) {
    this.build();
  }

  public getFilter() {
    return this.filter;
  }

  public getSort() {
    return this.sort;
  }

  public getPagination() {
    return { page: this.page, limit: this.limit };
  }

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

  private toArray(value: StringOrArray) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  private toBool(value: unknown) {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';

    return undefined;
  }

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

  private applyStatus() {
    const statuses = this.toArray(this.input.status) as TaskStatus[];
    if (statuses.length) {
      this.filter.status = { $in: statuses };
    }
  }

  private applyPriority() {
    const priorities = this.toArray(this.input.priority) as TaskPriority[];
    if (priorities.length) this.filter.priority = { $in: priorities };
  }

  private applyFlags() {
    const archived = this.toBool(this.input.isArchived);
    if (archived !== undefined) this.filter.isArchived = archived;

    const pinned = this.toBool(this.input.isPinned);
    if (pinned !== undefined) this.filter.isPinned = pinned;
  }

  private applyTags() {
    const tags = this.toArray(this.input.tags) as Tag[];
    if (tags.length) this.filter.tags = { $in: tags };

    const customTags = this.toArray(this.input.customTags);
    if (customTags.length) this.filter.customTags = { $in: customTags };
  }

  private applySearch() {
    const search = this.input.search?.trim();
    if (!search) return;

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearch, 'i');
    this.filter.$or = [{ title: regex }, { description: regex }];
  }

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
      // ids were provided but none were valid -> force no matches instead of returning all
      this.filter._id = { $in: [] };
    }
  }

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

  private applyPagination() {
    this.page = Math.max(1, Number(this.input.page) || 1);
    this.limit = Math.min(100, Math.max(1, Number(this.input.limit) || 5));
  }
}
