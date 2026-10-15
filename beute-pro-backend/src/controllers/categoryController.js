const categoryService = require('../services/categoryService');

/** Public: list all categories */
const list = async (req, res) => {
  try {
    const categories = await categoryService.getAll();
    res.json({ categories });
  } catch (err) {
    console.error('List categories error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Public: get one category */
const getOne = async (req, res) => {
  try {
    const category = await categoryService.getById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ category });
  } catch (err) {
    console.error('Get category error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: create */
const create = async (req, res) => {
  try {
    const category = await categoryService.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) {
    console.error('Create category error:', err.message);
    if (err.code === '23505') return res.status(409).json({ error: 'Category ID already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: update */
const update = async (req, res) => {
  try {
    const category = await categoryService.update(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true, category });
  } catch (err) {
    console.error('Update category error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: delete */
const remove = async (req, res) => {
  try {
    const ok = await categoryService.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};

module.exports = { list, getOne, create, update, remove };