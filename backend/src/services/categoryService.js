import { categoryHasTransactions, createCategory, deleteCategory, getCategoryById, listCategories, updateCategory } from '../models/categoryModel.js';

export const createUserCategory = async ({ userId, name, type }) => {
  return createCategory({ userId, name, type });
};

export const getUserCategories = async ({ userId, type }) => {
  return listCategories({ userId, type });
};

export const renameCategory = async ({ id, userId, name }) => {
  const category = await updateCategory({ id, userId, name });
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  return category;
};

export const removeCategory = async ({ id, userId }) => {
  const exists = await getCategoryById({ id, userId });
  if (!exists) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  const hasTx = await categoryHasTransactions({ id, userId });
  if (hasTx) {
    const err = new Error('Cannot delete category with existing transactions');
    err.status = 400;
    throw err;
  }
  return deleteCategory({ id, userId });
};
