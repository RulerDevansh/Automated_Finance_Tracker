import * as categoryService from '../services/categoryService.js';

export const list = async (req, res, next) => {
  try {
    const categories = await categoryService.getUserCategories({ userId: req.user.id, type: req.query.type });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    const category = await categoryService.createUserCategory({ userId: req.user.id, name, type });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const category = await categoryService.renameCategory({ id: req.params.id, userId: req.user.id, name: req.body.name });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await categoryService.removeCategory({ id: req.params.id, userId: req.user.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
