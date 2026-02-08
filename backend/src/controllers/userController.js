import * as userService from '../services/userService.js';

export const me = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { fullName, newPassword, baseCurrency } = req.body;
    const updated = await userService.updateProfile({ userId: req.user.id, fullName, newPassword, baseCurrency });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
