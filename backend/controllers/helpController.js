const helpService = require("../services/helpService");

exports.askAI = async (req, res, next) => {
  try {
    const result = await helpService.askAI(req.user, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

exports.askAIWithChatGPT = async (req, res, next) => {
  try {
    const result = await helpService.askAIWithChatGPT(req.user, req.body, req.headers);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
