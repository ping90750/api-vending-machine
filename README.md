## The first time must create db.

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL
);

CREATE TABLE currency (
    id SERIAL PRIMARY KEY,
    denomination INTEGER NOT NULL,
    count INTEGER NOT NULL
);

INSERT INTO currency (denomination, count) VALUES
(1, 100),
(5, 100),
(10, 100),
(20, 50),
(50, 50),
(100, 50),
(500, 20),
(1000, 10);
INSERT INTO products (name, price, stock ) VALUES ('Soda',20, 5),('Chips',15,10),('Candy', 10, 15),('Popcorn',50,3),('Nuts',30,4);
