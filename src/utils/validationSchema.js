const Joi = require('joi');

const schema = {};

schema.userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

schema.changePasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    currentPassword: Joi.string().min(6).required(),
    newPassword: Joi.string()
        .min(6)
        .disallow(Joi.ref('currentPassword'))
        .required()
        .messages({
            'any.invalid': 'New password must be different from current password',
        }),
});

schema.accountSchema = Joi.object({
    account_name: Joi.string().required(),
    website: Joi.string().uri().optional().allow('', null),
});

schema.accountUpdateSchema = Joi.object({
    account_name: Joi.string().optional(),
    website: Joi.string().uri().optional().allow('', null),
}).min(1);

schema.destinationSchema = Joi.object({
    url: Joi.string().uri().required(),
    http_method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD').required(),
    headers: Joi.object().required(),
});

schema.destinationUpdateSchema = Joi.object({
    url: Joi.string().uri().optional(),
    http_method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD').optional(),
    headers: Joi.object().optional(),
}).min(1);

module.exports = schema