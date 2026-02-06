import { findById, updateUser } from '../models/userModel.js';
import { hashPassword } from '../utils/password.js';

export const getProfile = async (userId) => {
  const user = await findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
};

export const updateProfile = async ({ userId, fullName, newPassword }) => {
  const updates = { id: userId };
  if (fullName) updates.fullName = fullName;
  if (newPassword) {
    updates.passwordHash = await hashPassword(newPassword);
  }
  const user = await updateUser(updates);
  return user;
};
