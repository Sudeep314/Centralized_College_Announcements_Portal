import mongoose from 'mongoose';

const urlRegex = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Announcement description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Academics', 'Examinations', 'Events', 'General'],
        message: '{VALUE} is not a valid category. Must be Academics, Examinations, Events, or General',
      },
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      default: null,
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return urlRegex.test(v);
        },
        message: 'sourceUrl must be a valid HTTP or HTTPS URL',
      },
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return urlRegex.test(v);
        },
        message: 'attachmentUrl must be a valid HTTP or HTTPS URL',
      },
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Indexes for high performance querying
// Text index for keyword search on title and description
announcementSchema.index({ title: 'text', description: 'text' });

// Compound index for sorted listing (pinned notices first, then newest published)
announcementSchema.index({ pinned: -1, publishedAt: -1 });

// Index for category filtering
announcementSchema.index({ category: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
