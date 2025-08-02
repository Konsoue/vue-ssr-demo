// middleware/validate.js
const Joi = require('joi');

function validateRequest(schema = Joi.object({})) {
  return async (ctx, next) => {
    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { error: error.details[0].message };
      return;
    }
    ctx.validatedBody = value; // 存储校验后的数据
    await next();
  };
}


module.exports = { validateRequest }
