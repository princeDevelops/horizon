import { TAG, TASK_PRIORITY, TASK_STATUS, type Task } from '@horizon/shared';
import mongoose, { type Document } from 'mongoose';

/** Task shape persisted in MongoDB (excluding virtual/derived fields). */
type TaskPersistence = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/** Mongoose task document contract with Date timestamps. */
export interface TaskDocument extends TaskPersistence, Document {
  createdAt: Date;
  updatedAt: Date;
}

/** Task collection schema with enum and default constraints. */
const TaskSchema = new mongoose.Schema<TaskDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.LOW,
    },
    description: {
      type: String,
    },
    dueDate: {
      type: String,
    },
    startDate: {
      type: String,
    },
    finishedAt: {
      type: String,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      enum: Object.values(TAG),
      default: [],
    },
    customTags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

/** Mongoose model for CRUD operations on tasks. */
export const TaskModel = mongoose.model<TaskDocument>('Task', TaskSchema);
