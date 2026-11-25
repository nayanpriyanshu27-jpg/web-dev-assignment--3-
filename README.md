# Assignment 3: Inventory and Data Management System

**Course:** Web Dev III <br>
**Name:** Aryan Kumar <br>
**Roll No:** 2501730431 <br>
**Date:** 17-11-2026

## About

This is a small REST API for managing a store's products. You can add products, change their details, adjust stock when something is sold or restocked, and get a couple of reports (low stock and a category summary). It's built with Node.js, Express and MongoDB through Mongoose, and the config lives in a `.env` file.

## Folder layout

```
Wev_dev_III - Assignment - 03/
  server.js                  starts the app and connects to MongoDB
  models/Product.js          the schema and validation
  routes/productRoutes.js    all the endpoints
  middleware/errorHandler.js 404 and error handling in one place
  screenshots                for all api screenshots
  .env                       port and database url
```

## How to run

1. Install the packages:
   ```
   npm install
   ```
2. Start MongoDB on your machine, then check the values in `.env`:
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017
   ```
3. Start the server:
   ```
   npm start
   ```
   It should print `MongoDB connected` and `Server running on port 5000`.

## The product schema

| Field | Type | Rules |
|---|---|---|
| name | String | required, 2 to 100 characters |
| sku | String | required, unique, saved in uppercase |
| category | String | required |
| price | Number | required, can't be negative |
| quantity | Number | required, whole number, can't be negative |
| reorderLevel | Number | defaults to 10 |
| supplier | String | optional |

`stockValue` (price x quantity) isn't saved in the database. It's a virtual field that gets calculated whenever a product is returned.

## Endpoints

| Method | URL | What it does |
|---|---|---|
| POST | /api/products | add a product |
| GET | /api/products | list products (filter, sort, pagination) |
| GET | /api/products/:id | get one product |
| PUT | /api/products/:id | update a product |
| DELETE | /api/products/:id | delete a product |
| PATCH | /api/products/:id/stock | restock or sell, using `{"change": 10}` or `{"change": -3}` |
| GET | /api/products/low-stock | products at or below their reorder level |
| GET | /api/products/summary | totals for each category |

Query options for the list: `category`, `supplier`, `search` (matches part of the name), `minPrice`, `maxPrice`, `sort` (like `-price` or `name,-price`), `page` and `limit` (10 by default, max 100).

## These are some points

- `/low-stock` and `/summary` are written above `/:id` in the routes file. If they came after it, Express would treat the word "summary" as an id.
- The stock endpoint checks the quantity and updates it in a single query, so a sale can never take the stock below zero.
- Errors all go through one handler. Bad input gives a 400, a duplicate SKU gives a 409, and a missing product gives a 404.

---

## Output screenshots

All ScreenShots are below

### 1. Create product
`POST /api/products`

![create product](screenshots/01-create.png)

<br><br><br><br>

### 2. Get all products
`GET /api/products`

![get all](screenshots/02-get-all.png)

<br><br><br><br>

### 3. Pagination
`GET /api/products?page=2&limit=5`

![pagination](screenshots/03-pagination.png)

<br><br><br><br>

### 4. Filtering
`GET /api/products?category=Furniture`

![filter](screenshots/04-filter.png)

<br><br><br><br>

### 5. Sorting
`GET /api/products?sort=-price`

![sort](screenshots/05-sort.png)

<br><br><br><br>

### 6. Get single product
`GET /api/products/:id`

![get one](screenshots/06-get-one.png)

<br><br><br><br>

### 7. Update product
`PUT /api/products/:id`

![update](screenshots/07-update.png)

<br><br><br><br>

### 8. Restock
`PATCH /api/products/:id/stock` with `{"change": 10}`

![restock](screenshots/08-restock.png)

<br><br><br><br>

### 9. Sale with not enough stock
`PATCH /api/products/:id/stock` with `{"change": -500}`

![sale error](screenshots/09-sale-error.png)

<br><br><br><br>

### 10. Low stock report
`GET /api/products/low-stock`

![low stock](screenshots/10-low-stock.png)

<br><br><br><br>

### 11. Category summary
`GET /api/products/summary`

![summary](screenshots/11-summary.png)

<br><br><br><br>

### 12. Validation error
`POST /api/products` with `{"name": "x", "price": -5}`

![validation](screenshots/12-validation.png)

<br><br><br><br>

### 13. Delete product
`DELETE /api/products/:id`

![delete](screenshots/13-delete.png)
