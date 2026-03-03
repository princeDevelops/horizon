/** Payload contract for bulk archive/pin updates. */
export interface BulkUpdateTaskFlagsInput {
  ids: string[];
  isArchived?: boolean;
  isPinned?: boolean;
}
