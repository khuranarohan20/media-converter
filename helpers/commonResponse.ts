export interface SuccessResponse<T = any> {
  status: "success";
  message: string;
  data?: T;
}

export interface ErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, any>;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export const commonSuccessResponse = <T = any>(
  message: string,
  data?: T,
): SuccessResponse<T> => {
  const response: SuccessResponse<T> = {
    status: "success",
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return response;
};

export const commonErrorResponse = (
  message: string,
  errors?: Record<string, any>,
): ErrorResponse => {
  const response: ErrorResponse = {
    status: "error",
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const paginatedResponse = <T = any>(
  message: string,
  items: T[],
  page: number,
  limit: number,
  total: number,
): SuccessResponse<PaginatedData<T>> => {
  const totalPages = Math.ceil(total / limit);

  return commonSuccessResponse<PaginatedData<T>>(message, {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
};

export const SuccessMessages = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  FETCHED: "Resource fetched successfully",
  UPLOADED: "File uploaded successfully",
  PROCESSED: "Request processed successfully",
} as const;

export const ErrorMessages = {
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access forbidden",
  INVALID_INPUT: "Invalid input data",
  SERVER_ERROR: "Internal server error",
  FILE_UPLOAD_ERROR: "File upload failed",
  INVALID_FILE_TYPE: "Invalid file type",
} as const;

export const success = {
  created: (data?: any) => commonSuccessResponse(SuccessMessages.CREATED, data),
  updated: (data?: any) => commonSuccessResponse(SuccessMessages.UPDATED, data),
  deleted: () => commonSuccessResponse(SuccessMessages.DELETED),
  fetched: (data?: any) => commonSuccessResponse(SuccessMessages.FETCHED, data),
  uploaded: (data?: any) =>
    commonSuccessResponse(SuccessMessages.UPLOADED, data),
  custom: <T = any>(message: string, data?: T) =>
    commonSuccessResponse<T>(message, data),
};

export const error = {
  notFound: (details?: string) =>
    commonErrorResponse(details || ErrorMessages.NOT_FOUND),
  unauthorized: (details?: string) =>
    commonErrorResponse(details || ErrorMessages.UNAUTHORIZED),
  forbidden: (details?: string) =>
    commonErrorResponse(details || ErrorMessages.FORBIDDEN),
  invalidInput: (errors?: Record<string, any>) =>
    commonErrorResponse(ErrorMessages.INVALID_INPUT, errors),
  serverError: (details?: string) =>
    commonErrorResponse(details || ErrorMessages.SERVER_ERROR),
  uploadError: (details?: string) =>
    commonErrorResponse(details || ErrorMessages.FILE_UPLOAD_ERROR),
  invalidFileType: (allowedTypes?: string[]) =>
    commonErrorResponse(
      ErrorMessages.INVALID_FILE_TYPE,
      allowedTypes ? { allowedTypes } : undefined,
    ),
  custom: (message: string, errors?: Record<string, any>) =>
    commonErrorResponse(message, errors),
};
