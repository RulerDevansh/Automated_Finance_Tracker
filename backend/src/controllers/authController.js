import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, baseCurrency } = req.body;
    const result = await authService.register({ email, password, fullName, baseCurrency });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { idToken, baseCurrency } = req.body;
    const result = await authService.googleLogin({ idToken, baseCurrency });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
