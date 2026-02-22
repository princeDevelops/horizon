export interface BulkUpdateTaskFlagsInput {
  ids : string[];
  isArchived?: boolean;
  isPinned?: boolean;
}