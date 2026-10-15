const Joi = require('joi');

// Pakistani mobile numbers only: 03xxxxxxxxx or +923xxxxxxxxx (spaces/dashes ignored).
const PK_PHONE = /^(?:0|\+92)3\d{9}$/;

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).required(),
  phone: Joi.string()
    .required()
    .custom((value, helpers) => {
      const normalized = value.replace(/[\s-]/g, '');
      if (!PK_PHONE.test(normalized)) return helpers.error('any.invalid');
      return normalized;
    })
    .messages({
      'string.empty': 'Phone number is required.',
      'any.required': 'Phone number is required.',
      'any.invalid': 'Enter a valid Pakistani mobile number as 03XXXXXXXXX or +923XXXXXXXXX.',
    }),
  address: Joi.string().min(5).required().messages({
    'string.empty': 'Address is required.',
    'any.required': 'Address is required.',
    'string.min': 'Address is too short — include street, area and city.',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).optional(),
  phone: Joi.string().pattern(/^[0-9+\-() ]+$/).optional(),
  address: Joi.string().optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

const adminCustomerUpdateSchema = Joi.object({
  full_name: Joi.string().min(2).required().messages({
    'string.empty': 'Name is required.',
    'string.min': 'Name is too short.',
  }),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .required()
    .custom((value, helpers) => {
      const normalized = value.replace(/[\s-]/g, '');
      if (!PK_PHONE.test(normalized)) return helpers.error('any.invalid');
      return normalized;
    })
    .messages({
      'string.empty': 'Phone number is required.',
      'any.required': 'Phone number is required.',
      'any.invalid': 'Enter a valid Pakistani mobile number as 03XXXXXXXXX or +923XXXXXXXXX.',
    }),
  address: Joi.string().min(5).required().messages({
    'string.empty': 'Address is required.',
    'any.required': 'Address is required.',
    'string.min': 'Address is too short — include street, area and city.',
  }),
});

// ============================================
// PHASE 5C — Bulk order actions
// ============================================
const bulkOrderStatusSchema = Joi.object({
  orderIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one order must be selected',
      'array.max': 'You can update at most 100 orders at once',
    }),
  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    .required(),
  adminNotes: Joi.string().allow('').optional(),
});

const bulkOrderTrackingSchema = Joi.object({
  orderIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one order must be selected',
      'array.max': 'You can update at most 100 orders at once',
    }),
  trackingNumber: Joi.string().min(1).max(100).required(),
  courierName: Joi.string().min(1).max(50).required(),
});

// ============================================
// PHASE 5C — User role management
// ============================================
const userRoleSchema = Joi.object({
  is_admin: Joi.boolean().required().messages({
    'any.required': 'is_admin is required',
    'boolean.base': 'is_admin must be a boolean',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  adminCustomerUpdateSchema,
  bulkOrderStatusSchema,
  bulkOrderTrackingSchema,
  userRoleSchema,
};