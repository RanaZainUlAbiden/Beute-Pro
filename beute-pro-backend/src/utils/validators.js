const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).required(),
  phone: Joi.string().pattern(/^[0-9+\-() ]+$/).optional(),
  address: Joi.string().optional(),
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

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};