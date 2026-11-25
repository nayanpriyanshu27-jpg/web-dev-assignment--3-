const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// passes rejected promises to the error middleware
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ---------- reports (these must come before /:id) ----------

// GET /api/products/low-stock
router.get(
  '/low-stock',
  wrap(async (req, res) => {
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    }).sort('quantity');

    res.json({ count: lowStockItems.length, lowStockItems });
  })
);

// GET /api/products/summary
router.get(
  '/summary',
  wrap(async (req, res) => {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { totalStockValue: -1 } },
    ]);

    res.json({ categories: summary.length, summary });
  })
);

// ---------- CRUD ----------

// POST /api/products
router.post(
  '/',
  wrap(async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  })
);

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&sort=&page=&limit=
router.get(
  '/',
  wrap(async (req, res) => {
    const { category, supplier, search, minPrice, maxPrice, sort } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: safe, $options: 'i' };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ?sort=-price,name  ->  "-price name"
    const sortBy = sort ? sort.split(',').join(' ') : '-createdAt';

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: products.length,
      products,
    });
  })
);

// GET /api/products/:id
router.get(
  '/:id',
  wrap(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw httpError(404, 'Product not found');
    res.json(product);
  })
);

// PUT /api/products/:id
router.put(
  '/:id',
  wrap(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) throw httpError(404, 'Product not found');
    res.json(product);
  })
);

// DELETE /api/products/:id
router.delete(
  '/:id',
  wrap(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw httpError(404, 'Product not found');
    res.json({ message: 'Product deleted', id: product.id });
  })
);

// PATCH /api/products/:id/stock   body: { "change": 10 } restock, { "change": -3 } sale
router.patch(
  '/:id/stock',
  wrap(async (req, res) => {
    const change = Number(req.body.change);
    if (!Number.isInteger(change) || change === 0) {
      throw httpError(400, 'change must be a non-zero whole number');
    }

    // the quantity check and the update happen in one query,
    // so two sales at the same time can't push stock below zero
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, quantity: { $gte: -change } },
      { $inc: { quantity: change } },
      { new: true }
    );

    if (!product) {
      const exists = await Product.exists({ _id: req.params.id });
      if (!exists) throw httpError(404, 'Product not found');
      throw httpError(400, 'Not enough stock for this sale');
    }

    res.json({ message: 'Stock updated', product });
  })
);

module.exports = router;
