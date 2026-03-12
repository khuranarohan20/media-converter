# Media Converter - High-Level Architecture (V1 - MVP)

## Table of Contents
- [System Overview](#system-overview)
- [Project Structure](#project-structure)
- [Database Schema (MongoDB)](#database-schema-mongodb)
- [API Endpoints Specification](#api-endpoints-specification)
- [API Design Principles](#api-design-principles)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Performance Considerations](#performance-considerations)
- [Technology Stack](#technology-stack)
- [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Future)                        │
│                    React/Next.js + TypeScript                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP (REST API)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REST API LAYER (Express)                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Routes                                                     │ │
│  │  ├─ /v1/files/*        - File management                   │ │
│  │  ├─ /v1/conversion/*   - Conversion operations             │ │
│  │  └─ /v1/storage/*      - Storage & stats                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SERVICE LAYER │  │   SERVICE LAYER │  │   SERVICE LAYER │
│                 │  │                 │  │                 │
│ FileService     │  │ConversionService│  │StorageService   │
│ - Upload        │  │ - Convert       │  │ - Save          │
│ - Validate      │  │ - Track Progress│  │ - Retrieve      │
│ - Delete        │  │ - Update Status │  │ - Cleanup       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA/STORAGE LAYER                        │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │ Local Storage  │  │   MongoDB      │                         │
│  │ (files/)       │  │                │                         │
│  │                │  │ - Files        │                         │
│  │ - Uploads/     │  │ - Conversions  │                         │
│  │ - Outputs/     │  │ - Batches      │                         │
│  │ - Temp/        │  │                │                         │
│  └────────────────┘  └────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
media-converter/
├── src/
│   ├── index.ts                 # Entry point
│   │
│   ├── routes/                  # API Routes
│   │   ├── file.route.ts        # File endpoints
│   │   ├── conversion.route.ts  # Conversion endpoints
│   │   ├── storage.route.ts     # Storage endpoints
│   │   └── index.ts             # Route aggregator
│   │
│   ├── services/                # Business Logic
│   │   ├── file.service.ts      # File operations
│   │   ├── conversion.service.ts # Conversion logic
│   │   └── storage.service.ts   # Storage management
│   │
│   ├── models/                  # Mongoose Models
│   │   ├── File.ts
│   │   ├── Conversion.ts
│   │   └── Batch.ts
│   │
│   ├── middlewares/             # Express Middlewares
│   │   ├── upload.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rate-limit.middleware.ts
│   │
│   ├── controllers/             # Request Handlers (Optional)
│   │   ├── file.controller.ts
│   │   └── conversion.controller.ts
│   │
│   ├── utils/                   # Helper Functions
│   │   ├── conversion.ts        # Sharp/FFmpeg wrappers
│   │   ├── fileHelper.ts
│   │   ├── validator.ts
│   │   └── commonResponse.ts
│   │
│   ├── types/                   # TypeScript Types
│   │   ├── file.ts
│   │   ├── conversion.ts
│   │   └── api.ts
│   │
│   ├── constants/               # Constants
│   │   ├── file.ts
│   │   └── errors.ts
│   │
│   └── config/                  # Configuration
│       ├── database.ts          # MongoDB connection
│       ├── storage.ts
│       └── index.ts
│
├── tests/                       # Tests
│   ├── unit/
│   └── integration/
│
├── storage/                     # File Storage
│   ├── uploads/
│   ├── outputs/
│   └── temp/
│
├── .env
├── tsconfig.json
├── package.json
└── README.md
```

---

## Database Schema (MongoDB)

### Collections

```javascript
// Files collection
db.createCollection("files");

// Files document structure
{
  _id: ObjectId,
  originalName: String,
  mimeType: String,
  size: Number,
  storagePath: String,
  status: String, // 'pending' | 'processing' | 'completed' | 'failed'
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    format: String
  },
  createdAt: Date,
  completedAt: Date
}

// Indexes for files collection
db.files.createIndex({ status: 1 });
db.files.createIndex({ createdAt: -1 });
db.files.createIndex({ originalName: 1 });

// Conversions collection
db.createCollection("conversions");

// Conversions document structure
{
  _id: ObjectId,
  fileId: ObjectId, // Reference to files._id
  targetFormat: String,
  options: {
    quality: Number,
    width: Number,
    height: Number,
    maintainAspectRatio: Boolean,
    stripMetadata: Boolean
  },
  outputPath: String,
  status: String, // 'pending' | 'processing' | 'completed' | 'failed'
  progress: Number, // 0-100
  errorMessage: String,
  createdAt: Date,
  startedAt: Date,
  completedAt: Date
}

// Indexes for conversions collection
db.conversions.createIndex({ fileId: 1 });
db.conversions.createIndex({ status: 1 });
db.conversions.createIndex({ createdAt: -1 });

// Batches collection (for batch operations)
db.createCollection("batches");

// Batches document structure
{
  _id: ObjectId,
  status: String, // 'pending' | 'processing' | 'completed' | 'failed'
  totalFiles: Number,
  completedFiles: Number,
  failedFiles: Number,
  conversionIds: [ObjectId], // Array of conversion _ids
  createdAt: Date,
  completedAt: Date
}

// Indexes for batches collection
db.batches.createIndex({ status: 1 });
db.batches.createIndex({ createdAt: -1 });
```

### Mongoose Models (TypeScript)

```typescript
// models/File.ts
import mongoose, { Schema } from 'mongoose';

export interface IFile {
  _id: mongoose.Types.ObjectId;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
  createdAt: Date;
  completedAt?: Date;
}

const FileSchema = new Schema<IFile>({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  storagePath: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

FileSchema.index({ status: 1 });
FileSchema.index({ createdAt: -1 });

export default mongoose.model<IFile>('File', FileSchema);

// models/Conversion.ts
export interface IConversion {
  _id: mongoose.Types.ObjectId;
  fileId: mongoose.Types.ObjectId;
  targetFormat: string;
  options?: {
    quality?: number;
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
    stripMetadata?: boolean;
  };
  outputPath?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const ConversionSchema = new Schema<IConversion>({
  fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true },
  targetFormat: { type: String, required: true },
  options: {
    quality: Number,
    width: Number,
    height: Number,
    maintainAspectRatio: Boolean,
    stripMetadata: Boolean
  },
  outputPath: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: { type: Number, default: 0 },
  errorMessage: String,
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  completedAt: Date
});

ConversionSchema.index({ fileId: 1 });
ConversionSchema.index({ status: 1 });

export default mongoose.model<IConversion>('Conversion', ConversionSchema);

// models/Batch.ts
export interface IBatch {
  _id: mongoose.Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  conversionIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  completedAt?: Date;
}

const BatchSchema = new Schema<IBatch>({
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  totalFiles: { type: Number, required: true },
  completedFiles: { type: Number, default: 0 },
  failedFiles: { type: Number, default: 0 },
  conversionIds: [{ type: Schema.Types.ObjectId, ref: 'Conversion' }],
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

export default mongoose.model<IBatch>('Batch', BatchSchema);
```

---

## API Endpoints Specification

### 1. FILE MANAGEMENT

#### Get All Files
```
GET /v1/files
Query params: ?page=1&limit=20&status=completed&sortBy=createdAt&order=desc

Response:
{
  files: [{
    _id: string,
    originalName: string,
    mimeType: string,
    size: number,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    outputPath?: string,
    createdAt: string,
    completedAt?: string
  }],
  total: number,
  page: number,
  limit: number
}
```

#### Get Single File
```
GET /v1/files/:id

Response:
{
  _id: string,
  originalName: string,
  mimeType: string,
  size: number,
  status: string,
  outputPath?: string,
  downloadUrl?: string,
  createdAt: string,
  completedAt?: string,
  metadata?: {
    width?: number,
    height?: number,
    duration?: number,
    format?: string
  }
}
```

#### Download File
```
GET /v1/files/:id/download

Response: File stream
Headers: Content-Disposition, Content-Type
```

#### Delete File
```
DELETE /v1/files/:id

Response: { message: string }
```

---

### 2. UPLOAD & CONVERSION

#### Upload & Convert File (Current Endpoint)
```
POST /v1/files/upload
Body: multipart/form-data with file field
Optional form fields: targetFormat, options (JSON string)

Response:
{
  _id: string,
  originalName: string,
  status: 'pending' | 'processing' | 'completed',
  outputPath?: string,
  message: string
}
```

#### Convert File (Separate Endpoint)
```
POST /v1/files/convert
Body: {
  fileId: string,
  targetFormat: string,
  options?: {
    width?: number,
    height?: number,
    quality?: number,
    maintainAspectRatio?: boolean,
    stripMetadata?: boolean
  }
}

Response:
{
  conversionId: string,
  fileId: string,
  status: 'pending' | 'processing',
  message: string
}
```

#### Get Conversion Status
```
GET /v1/conversion/:id/status

Response:
{
  _id: string,
  fileId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number, // 0-100
  currentStep?: string,
  outputPath?: string,
  errorMessage?: string,
  createdAt: string,
  completedAt?: string
}
```

---

### 3. CONVERSION OPTIONS

#### Get Target Formats
```
GET /v1/conversion/target-formats
Query: ?sourceType=image/png

Response:
{
  sourceType: string,
  category: 'image' | 'video' | 'audio' | 'document',
  targetFormats: [{
    format: string,
    extension: string,
    mimeType: string,
    description: string
  }],
  recommendedFormat: string
}
```

#### Get Conversion Options
```
GET /v1/conversion/options/:format

Response:
{
  format: string,
  category: string,
  options: {
    quality?: {
      type: 'number',
      min: number,
      max: number,
      default: number,
      description: string
    },
    width?: {
      type: 'number',
      min: number,
      max: number,
      description: string
    },
    height?: {
      type: 'number',
      min: number,
      max: number,
      description: string
    },
    maintainAspectRatio?: {
      type: 'boolean',
      default: true
    }
  }
}
```

---

### 4. SYSTEM

#### Health Check
```
GET /v1/health-check

Response: { status: 'ok', timestamp: string }
```

#### Configuration
```
GET /v1/config

Response:
{
  maxFileSize: number,
  maxConcurrentFiles: number,
  supportedFormats: string[]
}
```

---

## API Design Principles

### 1. Consistent Response Format

```typescript
// Success
{
  success: true,
  data: { /* actual data */ },
  message?: string
}

// Error
{
  success: false,
  error: {
    code: "FILE_TOO_LARGE",
    message: "File size exceeds 100MB limit",
    details: { /* context */ }
  }
}
```

### 2. Use IDs, Not Paths

```typescript
// ✅ Good
{ _id: "abc-123", downloadUrl: "/v1/files/abc-123/download" }

// ❌ Bad
{ path: "/storage/outputs/abc-123.webp" } // Exposes internal structure
```

### 3. Pagination for Lists

```typescript
// Always include pagination metadata
{
  files: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8
  }
}
```

### 4. Version Your API

```
/v1/...
/v2/...  // When you break backwards compatibility
```

---

## Error Handling

### HTTP Status Codes

| Code | Error Codes | Description |
|------|-------------|-------------|
| **400** | `INVALID_FILE_TYPE`<br>`FILE_TOO_LARGE`<br>`MISSING_REQUIRED_FIELD` | Validation Error |
| **404** | `FILE_NOT_FOUND`<br>`CONVERSION_NOT_FOUND` | Not Found |
| **413** | `REQUEST_TOO_LARGE` | Payload Too Large |
| **422** | `UNSUPPORTED_CONVERSION`<br>`CORRUPTED_FILE` | Unprocessable Entity |
| **429** | `RATE_LIMIT_EXCEEDED` | Too Many Requests |
| **500** | `INTERNAL_ERROR`<br>`CONVERSION_FAILED` | Server Error |

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: "FILE_TOO_LARGE",
    message: "File size exceeds 100MB limit",
    details: {
      maxSize: 104857600,
      receivedSize: 157286400
    }
  }
}
```

---

## Security Considerations

### 1. File Validation
- Check MIME type (not just extension)
- Validate file signatures (magic bytes)
- Scan for malware (optional - ClamAV)

### 2. Rate Limiting
- Uploads per IP per minute
- Max concurrent conversions per user

### 3. Input Sanitization
- Clean filenames (remove `../`, special chars)
- Validate all numeric inputs

### 4. Resource Limits
- Max file size (100MB)
- Timeout for conversions
- Disk space monitoring

---

## Performance Considerations

### 1. Streaming for Downloads
```typescript
// ✅ Good - Stream files
app.get('/v1/files/:id/download', async (req, res) => {
  const fileStream = createReadStream(filePath);
  fileStream.pipe(res);
});

// ❌ Bad - Load entire file in memory
app.get('/v1/files/:id/download', async (req, res) => {
  const file = readFile(filePath);
  res.send(file);
});
```

### 2. Cleanup Strategy
- Run daily cron job
- Delete files older than 7 days
- Clean up temp files after conversion

### 3. Database Indexes
- Index frequently queried fields (status, createdAt)
- Use compound indexes for common query patterns

### 4. Polling Strategy
- Frontend polls `GET /v1/conversion/:id/status` every 2-3 seconds
- Stop polling when status is 'completed' or 'failed'

---

## Technology Stack

| Component | Choice | Why |
|-----------|--------|-----|
| **Runtime** | Bun | Fast, built-in APIs, TypeScript support |
| **Framework** | Express | Mature, large ecosystem |
| **Database** | MongoDB | Flexible schema, scales well |
| **ODM** | Mongoose | Type-safe queries for MongoDB |
| **File Processing** | Sharp | Fast, battle-tested for images |
| **File Processing** | FFmpeg | Complete support for video/audio (future) |
| **Validation** | Zod | Type-safe validation |
| **Testing** | Bun test | Built-in test runner |

---

## Implementation Roadmap

### Phase 1 - Core MVP (Current State → Working MVP)
1. ✅ Basic file upload endpoint (already exists)
2. Set up MongoDB connection
3. Create Mongoose models (File, Conversion, Batch)
4. Implement file save to MongoDB on upload
5. Update conversion status in database
6. Add download endpoint with streaming

### Phase 2 - Enhanced UX
7. `GET /v1/files` - List files with pagination
8. `GET /v1/files/:id` - Get file details
9. `GET /v1/conversion/:id/status` - Progress tracking
10. `DELETE /v1/files/:id` - Delete files
11. `GET /v1/conversion/target-formats` - Available formats
12. `GET /v1/conversion/options/:format` - Format options

### Phase 3 - Advanced Features
13. `POST /v1/files/convert` - Separate convert endpoint
14. `POST /v1/files/batch-upload` - Batch operations
15. `GET /v1/storage/stats` - Statistics
16. `DELETE /v1/files/cleanup` - Bulk cleanup
17. Error handling middleware
18. Rate limiting middleware

---

## Summary

This V1 architecture focuses on a solid REST API with MongoDB for persistence. The frontend will poll for conversion status, keeping the implementation simple and easy to debug. Future versions can add real-time WebSocket updates and job queues when needed.

**Key Decisions:**
- REST-only API (no WebSocket for V1)
- MongoDB for flexible schema
- Polling-based progress tracking
- Synchronous processing for simplicity
- Local file storage

**Next Steps:**
1. Set up MongoDB connection
2. Create Mongoose models
3. Integrate database save/upload
4. Implement CRUD endpoints
5. Add proper error handling
