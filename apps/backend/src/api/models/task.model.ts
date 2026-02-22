import { TAG, TASK_PRIORITY, TASK_STATUS, type Task } from '@horizon/shared';
import mongoose, { type Document } from 'mongoose';

type TaskPersistence = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export interface TaskDocument extends TaskPersistence, Document {
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new mongoose.Schema<TaskDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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

export const TaskModel = mongoose.model<TaskDocument>('Task', TaskSchema);
