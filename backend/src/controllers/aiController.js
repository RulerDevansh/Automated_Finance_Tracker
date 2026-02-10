import { handleChat } from '../services/aiService.js';

export const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const result = await handleChat({ userId: req.user.id, message, history });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
