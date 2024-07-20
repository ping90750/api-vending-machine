const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");

const { Pool } = require("pg");

const app = express();
const port = 3500;

const pool = new Pool({
  user: "pingz",
  host: "localhost",
  database: "pingz",
  password: "",
  port: 5434,
});
pool.on("error", function (err, client) {
  console.error("idle client error", err.message, err.stack);
});
app.use(cors());
app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`Vending machine app listening at http://localhost:${port}`);
});

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE stock > 0");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const calculateChange = (amountPaid, price) => {
  const changeNeeded = amountPaid - price;
  console.log("changeNeeded", changeNeeded);
  let change = changeNeeded;
  const denominations = [1000, 500, 100, 50, 20, 10, 5, 1];

  const changeToGive = {};

  for (const denomination of denominations) {
    if (change >= denomination) {
      const count = Math.floor(change / denomination);
      changeToGive[denomination] = count;
      change -= denomination * count;
    }
  }

  return change === 0 ? { changeToGive, changeNeeded } : null;
};

const updateCurrencyStock = async (change) => {
  const queries = [];
  for (const [denomination, count] of Object.entries(change)) {
    queries.push(
      pool.query(
        "UPDATE currency SET count = count - $1 WHERE denomination = $2",
        [count, parseInt(denomination)]
      )
    );
  }
  await Promise.all(queries);
};

app.post("/purchase", async (req, res) => {
  const { productId, amountPaid } = req.body;

  try {
    const productResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );
    const product = productResult.rows[0];

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ error: "Product out of stock" });
    }

    if (amountPaid < product.price) {
      return res.status(400).json({ error: "Insufficient amount paid" });
    }

    const change = calculateChange(amountPaid, product.price);
    if (!change) {
      return res.status(400).json({ error: "Unable to provide change" });
    }

    await pool.query("UPDATE products SET stock = stock - 1 WHERE id = $1", [
      productId,
    ]);
    await updateCurrencyStock(change.changeToGive);
    res.json({ message: "Purchase successful", change });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE TABLE products (
//     id SERIAL PRIMARY KEY,
//     name VARCHAR(255) NOT NULL,
//     price INTEGER NOT NULL,
//     stock INTEGER NOT NULL
// );

// CREATE TABLE currency (
//     id SERIAL PRIMARY KEY,
//     denomination INTEGER NOT NULL,
//     count INTEGER NOT NULL
// );

// INSERT INTO currency (denomination, count) VALUES
// (1, 100),
// (5, 100),
// (10, 100),
// (20, 50),
// (50, 50),
// (100, 50),
// (500, 20),
// (1000, 10);
// INSERT INTO products (name, price, stock ) VALUES ('Soda',20, 5),('Chips',15,10),('Candy', 10, 15),('Popcorn',50,3),('Nuts',30,4);
