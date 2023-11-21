const Joi = require("joi");

const CommentJoiSchema = Joi.object({
  usercomment: Joi.string().required(),
  userid: Joi.string().required(), // Adjust the type based on your actual User ID type
});

module.exports = CommentJoiSchema;
