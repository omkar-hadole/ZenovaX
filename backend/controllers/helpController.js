const helpService = require("../services/helpService");

exports.askAI = async (req, res, next) => {
  try {
    const result = await helpService.askAI(req.prisma, req.cache, req.user, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

exports.askAIWithChatGPT = async (req, res, next) => {
  try {
    const result = await helpService.askAIWithChatGPT(req.prisma, req.cache, req.user, req.body, req.headers);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

exports.generateCodingQuestion = async (req, res, next) => {
  try {
    const result = await helpService.generateCodingQuestion(req.body, req.headers);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

exports.askCodeDebugger = async (req, res, next) => {
  try {
    const result = await helpService.askCodeDebugger(req.body, req.headers);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
