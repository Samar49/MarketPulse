const { askMarketPulseAI } = require("../services/aiService");


const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,

        code: "INVALID_MESSAGE",

        message: "Message is required",
      });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({
        success: false,

        code: "MESSAGE_TOO_LONG",

        message: "Message must be 500 characters or fewer",
      });
    }


    const data = await askMarketPulseAI(message.trim());

    return res.status(200).json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("AI controller error:", error.message);

    const statusCode =
      Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode <= 599
        ? error.statusCode
        : 500;

    return res.status(statusCode).json({
      success: false,

      code: error.code || "AI_REQUEST_FAILED",

      message: error.message || "Failed to generate AI response",
    });
  }
};

module.exports = {
  chatWithAI,
};
