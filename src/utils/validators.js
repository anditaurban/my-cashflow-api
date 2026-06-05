const { ApiError } = require('../middleware/errorHandler');

const TRANSACTION_TYPES = ['income', 'expense'];
const TRANSACTION_STATUSES = ['Selesai', 'Pending', 'Dibatalkan'];
const DISPLAY_MODES = ['light', 'dark'];

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function parseId(value, field = 'id') {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${field} harus berupa angka positif.`);
  }

  return id;
}

function normalizeString(value, field, options = {}) {
  const { maxLength, nullable = false, required = true } = options;

  if (value === undefined) {
    if (required) {
      throw new ApiError(400, `${field} wajib diisi.`);
    }

    return undefined;
  }

  if (value === null) {
    if (nullable) {
      return null;
    }

    throw new ApiError(400, `${field} tidak boleh kosong.`);
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, `${field} harus berupa teks.`);
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    throw new ApiError(400, `${field} wajib diisi.`);
  }

  if (!required && trimmed.length === 0) {
    return nullable ? null : '';
  }

  if (maxLength && trimmed.length > maxLength) {
    throw new ApiError(400, `${field} maksimal ${maxLength} karakter.`);
  }

  return trimmed;
}

function normalizeBoolean(value, field) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }

  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }

  throw new ApiError(400, `${field} harus bernilai true atau false.`);
}

function validateEnum(value, allowedValues, field) {
  if (!allowedValues.includes(value)) {
    throw new ApiError(400, `${field} harus salah satu dari: ${allowedValues.join(', ')}.`);
  }

  return value;
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}

function validateDate(value, field) {
  if (!isValidDateString(value)) {
    throw new ApiError(400, `${field} harus berformat YYYY-MM-DD.`);
  }

  return value;
}

function validateDateRange(startDate, endDate) {
  const start = validateDate(startDate, 'start_date');
  const end = validateDate(endDate, 'end_date');

  if (start > end) {
    throw new ApiError(400, 'start_date tidak boleh lebih besar dari end_date.');
  }

  return {
    end_date: end,
    start_date: start
  };
}

function validateLimit(value, fallback = 100, max = 500) {
  if (value === undefined) {
    return fallback;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit <= 0 || limit > max) {
    throw new ApiError(400, `limit harus berupa angka 1 sampai ${max}.`);
  }

  return limit;
}

function validateOffset(value) {
  if (value === undefined) {
    return 0;
  }

  const offset = Number(value);

  if (!Number.isInteger(offset) || offset < 0) {
    throw new ApiError(400, 'offset harus berupa angka 0 atau lebih.');
  }

  return offset;
}

function validateCategoryCreate(body) {
  if (hasOwn(body, 'is_default') && body.is_default !== false) {
    throw new ApiError(400, 'is_default tidak dapat dibuat melalui API.');
  }

  return {
    is_default: false,
    name: normalizeString(body.name, 'name', { maxLength: 100 }),
    type: validateEnum(body.type, TRANSACTION_TYPES, 'type')
  };
}

function validateCategoryUpdate(body) {
  if (hasOwn(body, 'type')) {
    throw new ApiError(400, 'type kategori tidak dapat diubah melalui endpoint update.');
  }

  if (hasOwn(body, 'is_default')) {
    throw new ApiError(400, 'is_default kategori tidak dapat diubah melalui endpoint update.');
  }

  return {
    name: normalizeString(body.name, 'name', { maxLength: 100 })
  };
}

function validateTransactionPayload(body, options = {}) {
  const { isUpdate = false } = options;
  const status = body.status === undefined && !isUpdate
    ? 'Selesai'
    : validateEnum(body.status, TRANSACTION_STATUSES, 'status');
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new ApiError(400, 'amount harus berupa angka 0 atau lebih.');
  }

  return {
    amount,
    category_id: parseId(body.category_id, 'category_id'),
    description: normalizeString(body.description, 'description', { maxLength: 255 }),
    note: normalizeString(body.note, 'note', { nullable: true, required: false }),
    payment_method_id: parseId(body.payment_method_id, 'payment_method_id'),
    status,
    transaction_date: validateDate(body.transaction_date, 'transaction_date'),
    type: validateEnum(body.type, TRANSACTION_TYPES, 'type')
  };
}

function validateTransactionFilters(query) {
  const filters = {
    keyword: normalizeString(query.keyword, 'keyword', { maxLength: 100, required: false }),
    limit: validateLimit(query.limit),
    offset: validateOffset(query.offset),
    status: query.status || 'all',
    type: query.type || 'all'
  };

  if (filters.type !== 'all') {
    validateEnum(filters.type, TRANSACTION_TYPES, 'type');
  }

  if (filters.status !== 'all') {
    validateEnum(filters.status, TRANSACTION_STATUSES, 'status');
  }

  const startDate = query.start_date || query.date_from;
  const endDate = query.end_date || query.date_to;

  if (startDate || endDate) {
    if (!startDate || !endDate) {
      throw new ApiError(400, 'start_date dan end_date wajib dikirim bersamaan.');
    }

    Object.assign(filters, validateDateRange(startDate, endDate));
  }

  return filters;
}

function validateSettingsPayload(body) {
  return {
    business_name: normalizeString(body.business_name, 'business_name', { maxLength: 150 }),
    currency: normalizeString(body.currency, 'currency', { maxLength: 10 }),
    date_format: normalizeString(body.date_format, 'date_format', { maxLength: 30 }),
    display_mode: validateEnum(body.display_mode, DISPLAY_MODES, 'display_mode'),
    notifications_enabled: normalizeBoolean(body.notifications_enabled, 'notifications_enabled'),
    owner_name: normalizeString(body.owner_name, 'owner_name', {
      maxLength: 150,
      nullable: true,
      required: false
    })
  };
}

module.exports = {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  parseId,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateDate,
  validateDateRange,
  validateLimit,
  validateSettingsPayload,
  validateTransactionFilters,
  validateTransactionPayload
};
