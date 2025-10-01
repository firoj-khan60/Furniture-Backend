const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const SSLCommerzPayment = require("sslcommerz-lts");

const store_id = process.env.SSL_ID;
const store_passwd = process.env.SSL_PASS;
const is_live = false; // Sandbox mode

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6wqcyng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("Furniture");
    const usersCollection = database.collection("users");
    const categoriesCollection = database.collection("categories");
    const subcategoriesCollection = database.collection("subcategories");
    const brandsCollection = database.collection("brands");
    const sizesCollection = database.collection("sizes");
    const colorsCollection = database.collection("colors");
    const productsCollection = database.collection("products");
    const reviewsCollection = database.collection("reviews");
    const cartCollection = database.collection("cart");
    const ordersCollection = database.collection("orders");
    const couponsCollection = database.collection("coupons");
    const posCartCollection = database.collection("pos_cart");
    const posOrdersCollection = database.collection("pos_orders");
    const expenseCategoriesCollection =
      database.collection("expense_categories");
    const expensesCollection = database.collection("expenses");
    const damageProductsCollection = database.collection("damage_products");
    const returnProductsCollection = database.collection("return_products");
    const sliderCollection = database.collection("sliders");
    const footerCollection = database.collection("footers");
    const offerCollection = database.collection("offers");
    const courierCollection = database.collection("courierSettings");
    const whisperCollection = database.collection("wispers");

    // POST endpoint to save user data (with role)
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      // console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Get role by email
    app.get("/users/role", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      if (!user) {
        return res.status(404).send({ role: null, message: "User not found" });
      }
      res.send({ role: user.role });
    });

    // PATCH endpoint to make a user an admin by ID
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // DELETE endpoint to remove a user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // Add a new category
    app.post("/categories", async (req, res) => {
      const category = req.body;
      const result = await categoriesCollection.insertOne(category);
      res.send(result);
    });

    // Get all categories
    app.get("/categories", async (req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    });

    // Get a single category by ID
    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const category = await categoriesCollection.findOne(query);
      res.send(category);
    });

    // Delete a category by ID
    app.delete("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoriesCollection.deleteOne(query);
      res.send(result);
    });

    // Update a category by ID
    app.put("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCategory = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: updatedCategory.name,
          image: updatedCategory.image,
          status: updatedCategory.status,
        },
      };
      const result = await categoriesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Add Subcategory
    app.post("/subcategories", async (req, res) => {
      const subcategory = req.body;
      const result = await subcategoriesCollection.insertOne(subcategory);
      res.send(result);
    });

    // Get Subcategories with category data
    app.get("/subcategories", async (req, res) => {
      const { categoryId } = req.query;
      const query = categoryId ? { categoryId } : {};
      const subcategories = await subcategoriesCollection.find(query).toArray();

      // Optionally populate category name
      for (let sub of subcategories) {
        const cat = await categoriesCollection.findOne({
          _id: new ObjectId(sub.categoryId),
        });
        sub.categoryName = cat?.name || null;
      }

      res.send(subcategories);
    });

    // Delete Subcategory
    app.delete("/subcategories/:id", async (req, res) => {
      const id = req.params.id;
      const result = await subcategoriesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Update Subcategory
    app.put("/subcategories/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: data.name,
          status: data.status,
          categoryId: data.categoryId,
        },
      };
      const result = await subcategoriesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Create brand
    app.post("/brands", async (req, res) => {
      const brand = req.body;
      const exists = await brandsCollection.findOne({ name: brand.name });
      if (exists)
        return res.send({
          acknowledged: true,
          insertedId: null,
          message: "Brand exists",
        });
      const result = await brandsCollection.insertOne(brand);
      res.send(result);
    });

    // --- Get all brands
    app.get("/brands", async (req, res) => {
      const result = await brandsCollection.find().toArray();
      res.send(result);
    });

    // --- Update brand
    app.put("/brands/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const result = await brandsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { name: data.name, logo: data.logo, status: data.status } }
      );
      res.send(result);
    });

    // --- Delete brand
    app.delete("/brands/:id", async (req, res) => {
      const id = req.params.id;
      const result = await brandsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Add Size
    app.post("/sizes", async (req, res) => {
      const size = req.body;
      const result = await sizesCollection.insertOne(size);
      res.send(result);
    });

    // Get all Sizes
    app.get("/sizes", async (req, res) => {
      const result = await sizesCollection.find().toArray();
      res.send(result);
    });

    // Delete Size
    app.delete("/sizes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await sizesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update Size
    app.put("/sizes/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: data.name,
          status: data.status,
        },
      };
      const result = await sizesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Add a new color
    app.post("/colors", async (req, res) => {
      const color = req.body;
      const existing = await colorsCollection.findOne({ name: color.name });
      if (existing) {
        return res.send({ message: "Color already exists", insertedId: null });
      }
      const result = await colorsCollection.insertOne(color);
      res.send(result);
    });

    // Get all colors
    app.get("/colors", async (req, res) => {
      const result = await colorsCollection.find().toArray();
      res.send(result);
    });

    // Delete a color by ID
    app.delete("/colors/:id", async (req, res) => {
      const id = req.params.id;
      const result = await colorsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Update a color
    app.put("/colors/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const result = await colorsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: data.name,
            hex: data.hex,
            status: data.status,
          },
        }
      );
      res.send(result);
    });

    // Add a new product
    app.post("/products", async (req, res) => {
      try {
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        res.send(result);
      } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send({ message: "Failed to add product" });
      }
    });

    // Get all products or filter
    app.get("/products", async (req, res) => {
      try {
        const { categoryId, subcategoryId, brandId, search } = req.query;
        let query = {};

        if (categoryId) query.categoryId = categoryId;
        if (subcategoryId) query.subcategoryId = subcategoryId;
        if (brandId) query.brandId = brandId;
        if (search) query.name = { $regex: search, $options: "i" };

        const products = await productsCollection.find(query).toArray();
        res.send(products);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch products" });
      }
    });

    // Update a product by ID
    app.put("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedProduct = req.body;

        // Validate id
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid product ID" });
        }

        // Prepare update document
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            name: updatedProduct.name,
            description: updatedProduct.description,
            specification: updatedProduct.specification,
            categoryId: updatedProduct.categoryId,
            subcategoryId: updatedProduct.subcategoryId,
            brandId: updatedProduct.brandId,
            sizes: updatedProduct.sizes,
            colors: updatedProduct.colors,
            purchasePrice: Number(updatedProduct.purchasePrice),
            oldPrice: Number(updatedProduct.oldPrice),
            newPrice: Number(updatedProduct.newPrice),
            stock: Number(updatedProduct.stock),
            status: updatedProduct.status,
            variant: updatedProduct.variant,
            images: updatedProduct.images,
            email: updatedProduct.email,
            barcode: updatedProduct.barcode,
          },
        };

        const result = await productsCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Product not found" });
        }

        res.send({ acknowledged: true, modifiedCount: result.modifiedCount });
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send({ message: "Failed to update product" });
      }
    });

    app.delete("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await productsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send({ message: "Failed to delete product" });
      }
    });

    // Get single product by ID
    app.get("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid product ID" });
        }
        const product = await productsCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!product) {
          return res.status(404).send({ message: "Product not found" });
        }
        res.send(product);
      } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send({ message: "Failed to fetch product" });
      }
    });

    app.post("/reviews", async (req, res) => {
      try {
        const { productId, rating, text, name, email } = req.body;

        if (!productId || !rating || !text) {
          return res.status(400).send({ message: "Missing required fields" });
        }

        const review = {
          productId: new ObjectId(productId),
          rating,
          text,
          name: name || "Anonymous",
          email: email || null,
          createdAt: new Date(),
        };

        const result = await reviewsCollection.insertOne(review);

        if (result.acknowledged) {
          review._id = result.insertedId; // add id to the review object
          res.send({ acknowledged: true, review });
        } else {
          res
            .status(500)
            .send({ acknowledged: false, message: "Failed to add review" });
        }
      } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.get("/reviews", async (req, res) => {
      const { productId } = req.query;
      let query = {};
      if (productId) {
        query.productId = new ObjectId(productId);
      }
      const reviews = await reviewsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      res.send(reviews);
    });

    app.delete("/reviews/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await reviewsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).send({ message: "Failed to delete review" });
      }
    });

    app.post("/cart", async (req, res) => {
      try {
        const cartItem = req.body; // name, email, productId, quantity, etc.
        const result = await cartCollection.insertOne(cartItem);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add to cart" });
      }
    });

    app.get("/cart", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      try {
        const cartItems = await cartCollection.find({ email }).toArray();
        res.send(cartItems);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to get cart items" });
      }
    });

    app.patch("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const { quantity, selected } = req.body; // optionally selected
      const updateDoc = {};
      if (quantity !== undefined) updateDoc.quantity = quantity;
      if (selected !== undefined) updateDoc.selected = selected;

      try {
        const result = await cartCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateDoc }
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update cart item" });
      }
    });

    app.delete("/cart/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await cartCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Cart item not found" });
        }

        res.send({ acknowledged: true, deletedCount: result.deletedCount });
      } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).send({ message: "Failed to delete cart item" });
      }
    });

    app.post("/orders", async (req, res) => {
      try {
        const order = req.body;
        order.createdAt = new Date();

        // save order first
        const result = await ordersCollection.insertOne(order);

        // if courier selected and active
        if (order.courier) {
          const courier = await courierCollection.findOne({
            courierName: order.courier,
            status: "active",
          });

          if (courier) {
            try {
              // Example Pathao API integration (dummy)
              const response = await axios.post(
                `${courier.baseUrl}/aladdin/api/v1/orders`,
                {
                  order_id: result.insertedId,
                  recipient_name: order.customerName,
                  recipient_phone: order.customerPhone,
                  recipient_address: order.customerAddress,
                  amount_to_collect: order.totalPrice,
                },
                {
                  headers: {
                    Authorization: `Bearer ${courier.apiKey}`,
                  },
                }
              );

              // update order with courier response
              await ordersCollection.updateOne(
                { _id: result.insertedId },
                {
                  $set: {
                    courierTrackingId: response.data.tracking_id || null,
                    courierStatus: "placed",
                  },
                }
              );
            } catch (err) {
              console.error("Courier API failed:", err.message);
              await ordersCollection.updateOne(
                { _id: result.insertedId },
                {
                  $set: {
                    courierStatus: "failed",
                    courierError: err.message,
                  },
                }
              );
            }
          }
        }

        res.send({ acknowledged: true, insertedId: result.insertedId });
      } catch (error) {
        console.error("Failed to place order:", error);
        res.status(500).send({ message: "Failed to place order" });
      }
    });

    // Get orders for a specific user
    app.get("/orders", async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};

        // If email query is provided, filter orders by email
        if (email) {
          query.email = email;
        }

        const orders = await ordersCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(orders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        res.status(500).send({ message: "Failed to fetch orders" });
      }
    });

    // Delete an order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const result = await ordersCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Update order status & adjust stock
    app.patch("/orders/:id/status", async (req, res) => {
      try {
        const { status } = req.body;
        const id = req.params.id;

        // Find order by id
        const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
        if (!order) {
          return res
            .status(404)
            .send({ success: false, message: "Order not found" });
        }

        // Update order status
        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: status } }
        );

        // If status is delivered, reduce stock
        if (status === "delivered" && order.cartItems) {
          for (const item of order.cartItems) {
            await productsCollection.updateOne(
              { _id: new ObjectId(item.productId) },
              { $inc: { stock: -Number(item.quantity) } }
            );
          }
        }

        res.send({
          success: true,
          message: "Status updated & stock adjusted if delivered",
        });
      } catch (error) {
        console.error("Failed to update status:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

    app.post("/coupons", async (req, res) => {
      try {
        const coupon = req.body;

        // Optional: add a createdAt timestamp
        coupon.createdAt = new Date();

        const result = await couponsCollection.insertOne(coupon);
        res.send({ acknowledged: true, insertedId: result.insertedId });
      } catch (error) {
        console.error("Failed to add coupon:", error);
        res.status(500).send({ message: "Failed to add coupon" });
      }
    });

    // Get all coupons or filter by status
    app.get("/coupons", async (req, res) => {
      try {
        const status = req.query.status; // optional query param
        let query = {};

        if (status) {
          query.status = status;
        }

        const coupons = await couponsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        res.send(coupons);
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
        res.status(500).send({ message: "Failed to fetch coupons" });
      }
    });

    // Update a coupon
    app.put("/coupons/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = req.body;

        const result = await couponsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        res.send(result);
      } catch (error) {
        console.error("Failed to update coupon:", error);
        res.status(500).send({ message: "Failed to update coupon" });
      }
    });

    // Delete a coupon by id
    app.delete("/coupons/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await couponsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Failed to delete coupon:", error);
        res.status(500).send({ message: "Failed to delete coupon" });
      }
    });

    app.post("/apply-coupon", async (req, res) => {
      try {
        const codeRaw = req.body.code;
        const totalAmount = Number(req.body.totalAmount) || 0;

        if (!codeRaw) {
          return res.status(400).send({ message: "Coupon code is required" });
        }

        // use exactly as stored
        const code = codeRaw.trim();

        const coupon = await couponsCollection.findOne({
          code,
          status: "active",
        });
        if (!coupon) {
          return res
            .status(404)
            .send({ message: "Invalid or inactive coupon" });
        }

        const now = new Date();

        if (coupon.startDate && new Date(coupon.startDate) > now) {
          return res.status(400).send({ message: "Coupon is not active yet" });
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
          return res.status(400).send({ message: "Coupon has expired" });
        }

        const minReq = Number(coupon.minOrderAmount) || 0;
        if (minReq && totalAmount < minReq) {
          return res
            .status(400)
            .send({ message: `Minimum order amount is ${minReq}` });
        }

        let discount = 0;
        if (coupon.discountType === "percentage") {
          discount = (totalAmount * Number(coupon.discountValue || 0)) / 100;
        } else if (coupon.discountType === "fixed") {
          discount = Number(coupon.discountValue || 0);
        }

        if (discount < 0) discount = 0;
        if (discount > totalAmount) discount = totalAmount;

        const finalAmount = Math.max(totalAmount - discount, 0);

        return res.send({
          success: true,
          code: coupon.code,
          discount: Math.round(discount),
          finalAmount,
          message: "Coupon applied successfully",
        });
      } catch (error) {
        console.error("Failed to apply coupon:", error);
        res.status(500).send({ message: "Failed to apply coupon" });
      }
    });

    app.post("/sslcommerz/init", async (req, res) => {
      try {
        const {
          orderId,
          totalAmount,
          fullName,
          email,
          phone,
          address,
          cartItems,
        } = req.body;

        const data = {
          total_amount: totalAmount,
          currency: "BDT",
          tran_id: `tran_${Date.now()}`, // must be unique
          success_url:
            "https://e-commerce-server-api.onrender.com/sslcommerz/success",
          fail_url:
            "https://e-commerce-server-api.onrender.com/sslcommerz/fail",
          cancel_url:
            "https://e-commerce-server-api.onrender.com/sslcommerz/cancel",
          ipn_url: "https://e-commerce-server-api.onrender.com/sslcommerz/ipn",
          shipping_method: "Courier",
          product_name: "Order Payment",
          product_category: "Ecommerce",
          product_profile: "general",
          order_id: orderId,

          // Customer info
          cus_name: fullName,
          cus_email: email,
          cus_add1: address,
          cus_add2: address,
          cus_city: "Dhaka",
          cus_state: "Dhaka",
          cus_postcode: "1000",
          cus_country: "Bangladesh",
          cus_phone: phone,
          cus_fax: phone,

          // Shipping info (must include!)
          ship_name: fullName,
          ship_add1: address,
          ship_add2: address,
          ship_city: "Dhaka",
          ship_state: "Dhaka",
          ship_postcode: 1000,
          ship_country: "Bangladesh",
          cartItems: JSON.stringify(cartItems),
        };

        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);

        if (apiResponse?.GatewayPageURL) {
          res.json({ GatewayPageURL: apiResponse.GatewayPageURL });
        } else {
          res
            .status(400)
            .json({ message: "Failed to get GatewayPageURL", apiResponse });
        }
      } catch (err) {
        console.error("SSLCommerz Init Error:", err);
        res
          .status(500)
          .json({ message: "SSLCommerz init failed", error: err.message });
      }
    });

    // Success/Fail/Cancel routes
    app.all("/sslcommerz/success", async (req, res) => {
      try {
        // SSLCommerz might send data in req.body or req.query
        const paymentData = req.body || req.query || {};

        console.log("Payment Success:", paymentData);

        // Safely destructure
        const {
          tran_id,
          status,
          firstname,
          email,
          phone,
          cus_add1,
          cartItems,
          amount,
        } = paymentData;

        if (!tran_id) {
          return res
            .status(400)
            .send("Transaction ID missing from payment data");
        }

        // Prepare order data
        const orderData = {
          fullName: firstname || "Customer",
          email: email || "no-email@example.com",
          phone: phone || "N/A",
          address: cus_add1 || "N/A",
          payment: "online",
          tran_id,
          status:
            status === "VALID" || status === "VALIDATED" ? "paid" : "failed",
          cartItems: cartItems ? JSON.parse(cartItems) : [],
          subtotal: amount || 0,
          shippingCost: 0, // optional
          discount: 0, // optional
          total: amount || 0,
          createdAt: new Date(),
        };

        // Save to DB
        await ordersCollection.insertOne(orderData);

        // Redirect to frontend success page
        res.redirect(
          `http://localhost:5173/payment-success?tran_id=${tran_id}`
        );
      } catch (err) {
        console.error("Payment Success Error:", err);
        res.status(500).send("Failed to process payment");
      }
    });

    app.post("/sslcommerz/fail", (req, res) => {
      console.log("Payment Failed:", req.body);
      res.redirect("http://localhost:5173/payment-fail");
    });

    app.post("/sslcommerz/cancel", (req, res) => {
      console.log("Payment Cancelled:", req.body);
      res.redirect("http://localhost:5173/payment-cancel");
    });

    // Add item to POS cart
    app.post("/pos/cart", async (req, res) => {
      try {
        const cartItem = req.body; // productId, quantity, price, etc.
        const result = await posCartCollection.insertOne(cartItem);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add to POS cart" });
      }
    });

    // Get all POS cart items
    app.get("/pos/cart", async (req, res) => {
      try {
        const cartItems = await posCartCollection.find().toArray();
        res.send(cartItems);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch POS cart" });
      }
    });

    // Update quantity
    app.patch("/pos/cart/:id", async (req, res) => {
      const { quantity } = req.body;
      try {
        const result = await posCartCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { quantity } }
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update POS cart item" });
      }
    });

    // Delete item from POS cart
    app.delete("/pos/cart/:id", async (req, res) => {
      try {
        const result = await posCartCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to delete POS cart item" });
      }
    });

    // Place POS order
    app.post("/pos/orders", async (req, res) => {
      try {
        const order = req.body;
        order.orderType = "pos";
        order.status = "paid";
        order.createdAt = new Date();

        // 1. Save order
        const result = await posOrdersCollection.insertOne(order);

        // 2. Update stock for each product
        for (const item of order.cartItems) {
          await productsCollection.updateOne(
            { _id: new ObjectId(item.productId) },
            { $inc: { stock: -Number(item.quantity) } }
          );
        }

        // 3. Clear POS cart
        await posCartCollection.deleteMany({});

        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to save POS order" });
      }
    });

    // Get all POS orders
    app.get("/pos/orders", async (req, res) => {
      try {
        const orders = await posOrdersCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(orders);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch POS orders" });
      }
    });

    app.delete("/pos/orders/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await posOrdersCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).send({ message: "Failed to delete order" });
      }
    });

    app.get("/sales-report", async (req, res) => {
      try {
        const deliveredOrders = (
          await ordersCollection.find({ status: "delivered" }).toArray()
        ).map((o) => ({
          ...o,
          orderType: "Online",
          cartItems: o.cartItems || [],
          createdAt: o.createdAt || o.date || new Date(),
        }));

        const posOrders = (await posOrdersCollection.find().toArray()).map(
          (o) => ({
            ...o,
            orderType: "POS",
            cartItems: o.cartItems || [],
            createdAt: o.createdAt || o.date || new Date(),
          })
        );

        // Combine all
        const allOrders = [...deliveredOrders, ...posOrders].map((order) => ({
          ...order,
          products: order.cartItems || [],
          total: order.totalPrice || order.total || 0,
          orderType: order.orderType,
        }));

        const calcTotal = (orders) =>
          orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

        const filterByDate = (orders, period) => {
          const now = new Date();
          return orders.filter((order) => {
            const orderDate = new Date(order.createdAt);
            if (period === "today") {
              return orderDate.toDateString() === now.toDateString();
            } else if (period === "yesterday") {
              const yest = new Date(now);
              yest.setDate(now.getDate() - 1);
              return orderDate.toDateString() === yest.toDateString();
            } else if (period === "week") {
              const weekAgo = new Date();
              weekAgo.setDate(now.getDate() - 7);
              return orderDate >= weekAgo;
            } else if (period === "lastWeek") {
              const prevWeekStart = new Date();
              prevWeekStart.setDate(now.getDate() - 14);
              const prevWeekEnd = new Date();
              prevWeekEnd.setDate(now.getDate() - 7);
              return orderDate >= prevWeekStart && orderDate < prevWeekEnd;
            } else if (period === "month") {
              return (
                orderDate.getMonth() === now.getMonth() &&
                orderDate.getFullYear() === now.getFullYear()
              );
            } else if (period === "lastMonth") {
              const month = now.getMonth() - 1;
              const year = now.getFullYear();
              return (
                orderDate.getMonth() === month &&
                orderDate.getFullYear() === year
              );
            }
            return true;
          });
        };

        res.send({
          allTime: calcTotal(allOrders),
          thisMonth: calcTotal(filterByDate(allOrders, "month")),
          lastMonth: calcTotal(filterByDate(allOrders, "lastMonth")),
          thisWeek: calcTotal(filterByDate(allOrders, "week")),
          lastWeek: calcTotal(filterByDate(allOrders, "lastWeek")),
          today: calcTotal(filterByDate(allOrders, "today")),
          yesterday: calcTotal(filterByDate(allOrders, "yesterday")),
          allOrders,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to generate sales report" });
      }
    });

    // Add Expense Category
    app.post("/expense-categories", async (req, res) => {
      const expenseCategory = req.body;
      const result = await expenseCategoriesCollection.insertOne(
        expenseCategory
      );
      res.send(result);
    });

    // Get Expense Categories
    app.get("/expense-categories", async (req, res) => {
      const result = await expenseCategoriesCollection.find().toArray();
      res.send(result);
    });

    // Delete Expense Category
    app.delete("/expense-categories/:id", async (req, res) => {
      const id = req.params.id;
      const result = await expenseCategoriesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Update Expense Category
    app.put("/expense-categories/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      try {
        const result = await expenseCategoriesCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              name: updatedData.name,
              status: updatedData.status,
            },
          }
        );

        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "Expense category updated successfully",
          });
        } else {
          res.send({
            success: false,
            message: "No changes made or category not found",
          });
        }
      } catch (error) {
        console.error("Error updating expense category:", error);
        res.status(500).send({
          success: false,
          message: "Failed to update expense category",
        });
      }
    });

    // Add Expense
    app.post("/expenses", async (req, res) => {
      try {
        const expense = {
          ...req.body,
          price: Number(req.body.price), // store as number
          date: new Date(req.body.date), // store as Date
        };

        const result = await expensesCollection.insertOne(expense);
        res.send(result);
      } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).send({ message: "Failed to add expense" });
      }
    });

    // Get All Expenses
    app.get("/expenses", async (req, res) => {
      try {
        const result = await expensesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).send({ message: "Failed to fetch expenses" });
      }
    });

    // Update Expense - ensure proper data types
    app.put("/expenses/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const updatedExpense = {
          ...req.body,
          price: Number(req.body.price), // convert to number
          date: new Date(req.body.date), // convert to Date
        };

        const result = await expensesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedExpense }
        );

        res.send(result);
      } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).send({ message: "Failed to update expense" });
      }
    });

    // Delete Expense
    app.delete("/expenses/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await expensesCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).send({ message: "Failed to delete expense" });
      }
    });

    app.get("/expenses/report", async (req, res) => {
      try {
        const { startDate, endDate } = req.query;

        let filter = {};
        if (startDate && endDate) {
          filter.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }

        const expenses = await expensesCollection.find(filter).toArray();
        const now = new Date();

        const total = expenses.reduce(
          (sum, e) => sum + Number(e.price || 0),
          0
        );

        // If custom date filter is applied → only return filtered total
        if (startDate && endDate) {
          return res.send({ total });
        }

        // Otherwise → full report
        const today = expenses
          .filter((e) => new Date(e.date).toDateString() === now.toDateString())
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(now.getDate() - 1);
        const yesterday = expenses
          .filter(
            (e) =>
              new Date(e.date).toDateString() === yesterdayDate.toDateString()
          )
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const thisWeek = expenses
          .filter((e) => new Date(e.date) >= weekStart)
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const prevWeekStart = new Date(now);
        prevWeekStart.setDate(now.getDate() - 14);
        const prevWeekEnd = new Date(now);
        prevWeekEnd.setDate(now.getDate() - 7);
        const previousWeek = expenses
          .filter(
            (e) =>
              new Date(e.date) >= prevWeekStart &&
              new Date(e.date) < prevWeekEnd
          )
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const thisMonth = expenses
          .filter(
            (e) =>
              new Date(e.date).getMonth() === now.getMonth() &&
              new Date(e.date).getFullYear() === now.getFullYear()
          )
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const previousMonth = expenses
          .filter(
            (e) =>
              new Date(e.date).getMonth() === now.getMonth() - 1 &&
              new Date(e.date).getFullYear() === now.getFullYear()
          )
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        res.send({
          total,
          today,
          yesterday,
          thisWeek,
          previousWeek,
          thisMonth,
          previousMonth,
        });
      } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).send({ message: "Failed to generate report" });
      }
    });

    // Get customer segments
    app.get("/customer-segments", async (req, res) => {
      try {
        const pipeline = [
          {
            $group: {
              _id: "$email",
              name: { $first: "$fullName" },
              phone: { $first: "$phone" },
              totalOrders: { $sum: 1 },
              totalSpend: { $sum: "$total" },
              lastOrder: { $max: "$createdAt" },
            },
          },
          {
            $addFields: {
              segment: {
                $switch: {
                  branches: [
                    { case: { $gte: ["$totalOrders", 10] }, then: "Loyal" },
                    {
                      case: { $gte: ["$totalSpend", 20000] },
                      then: "High Spender",
                    },
                    { case: { $gte: ["$totalOrders", 3] }, then: "Regular" },
                  ],
                  default: "One-time",
                },
              },
            },
          },
          { $sort: { totalSpend: -1 } },
        ];

        const segments = await ordersCollection.aggregate(pipeline).toArray();
        res.send(segments);
      } catch (error) {
        console.error("Failed to fetch segments:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Add a new damaged product
    app.post("/damage-products", async (req, res) => {
      try {
        const damageProduct = req.body;
        const result = await damageProductsCollection.insertOne(damageProduct);
        res.send(result);
      } catch (error) {
        console.error("Add Damage Product Error:", error);
        res.status(500).send({ error: "Failed to add damaged product" });
      }
    });

    // Get all damaged products
    app.get("/damage-products", async (req, res) => {
      try {
        const result = await damageProductsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch damaged products" });
      }
    });

    // Get a single damaged product by ID
    app.get("/damage-products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const product = await damageProductsCollection.findOne(query);
        res.send(product);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch damaged product" });
      }
    });

    // Update a damaged product by ID
    app.put("/damage-products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedProduct = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedProduct };
        const result = await damageProductsCollection.updateOne(
          filter,
          updateDoc
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update damaged product" });
      }
    });

    // Delete a damaged product by ID
    app.delete("/damage-products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await damageProductsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete damaged product" });
      }
    });

    // Add a new return product
    app.post("/return-products", async (req, res) => {
      try {
        const returnProduct = req.body;
        const result = await returnProductsCollection.insertOne(returnProduct);
        res.send(result);
      } catch (error) {
        console.error("Add Return Product Error:", error);
        res.status(500).send({ error: "Failed to add return product" });
      }
    });

    // Get all return products
    app.get("/return-products", async (req, res) => {
      try {
        const result = await returnProductsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch return products" });
      }
    });

    // Get a single return product by ID
    app.get("/return-products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const product = await returnProductsCollection.findOne(query);
        res.send(product);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch return product" });
      }
    });

    // Update a return product by ID
    app.put("/return-products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedProduct = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedProduct };
        const result = await returnProductsCollection.updateOne(
          filter,
          updateDoc
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update return product" });
      }
    });

    // Delete a return product by ID
    app.delete("/return-products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await returnProductsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete return product" });
      }
    });

    // Add a new slider
    app.post("/slider", async (req, res) => {
      try {
        const slider = req.body;
        slider.createdAt = new Date();
        const result = await sliderCollection.insertOne(slider);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to add slider" });
      }
    });

    // Get all sliders
    app.get("/slider", async (req, res) => {
      try {
        const sliders = await sliderCollection.find().toArray();
        res.send(sliders);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch sliders" });
      }
    });

    // Get a single slider by ID
    app.get("/slider/:id", async (req, res) => {
      const id = req.params.id;
      const slider = await sliderCollection.findOne({ _id: new ObjectId(id) });
      res.send(slider);
    });

    // Update a slider by ID
    app.put("/slider/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await sliderCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.send(result);
    });

    // Delete a slider by ID
    app.delete("/slider/:id", async (req, res) => {
      const id = req.params.id;
      const result = await sliderCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Add Footer Info
    app.post("/footer", async (req, res) => {
      try {
        const footer = { ...req.body, createdAt: new Date() };
        const result = await footerCollection.insertOne(footer);
        res.send({ insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to add footer" });
      }
    });

    // Get All Footers
    app.get("/footer", async (req, res) => {
      try {
        const allFooters = await footerCollection.find().toArray();
        res.send(allFooters);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch footers" });
      }
    });

    // Update Footer
    app.put("/footer/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await footerCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: req.body },
          { returnDocument: "after" }
        );
        res.send(result.value);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to update footer" });
      }
    });

    // Delete Footer
    app.delete("/footer/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await footerCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to delete footer" });
      }
    });

    // Get all categories with subcategories
    app.get("/categories-with-subcategories", async (req, res) => {
      try {
        const categories = await categoriesCollection.find().toArray();

        const categoriesWithSub = await Promise.all(
          categories.map(async (cat) => {
            const subs = await subcategoriesCollection
              .find({ categoryId: cat._id.toString() })
              .toArray();

            return {
              ...cat,
              subcategories: subs,
            };
          })
        );

        res.send(categoriesWithSub);
      } catch (error) {
        console.error("Error fetching categories with subcategories:", error);
        res
          .status(500)
          .send({ message: "Failed to fetch categories with subcategories" });
      }
    });

    // Get all offers
    app.get("/offers", async (req, res) => {
      try {
        const offers = await offerCollection.find().toArray();
        res.send(offers);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch offers" });
      }
    });

    // Get a single offer by ID
    app.get("/offers/:id", async (req, res) => {
      const id = req.params.id;
      const offer = await offerCollection.findOne({ _id: new ObjectId(id) });
      res.send(offer);
    });

    // Add a new offer
    app.post("/offers", async (req, res) => {
      const offerData = req.body; // { image, status, email }
      try {
        const result = await offerCollection.insertOne(offerData);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to add offer" });
      }
    });

    // Update an offer by ID
    app.put("/offers/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      try {
        const result = await offerCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to update offer" });
      }
    });

    // Delete an offer by ID
    app.delete("/offers/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await offerCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to delete offer" });
      }
    });

    // Save or Update Courier Settings
    app.post("/courier/settings", async (req, res) => {
      try {
        const data = req.body;
        const existing = await courierCollection.findOne({
          courierName: data.courierName,
        });

        if (existing) {
          await courierCollection.updateOne(
            { courierName: data.courierName },
            { $set: data }
          );
        } else {
          await courierCollection.insertOne(data);
        }

        res.send({ success: true, message: "Courier settings saved" });
      } catch (error) {
        console.error("Failed to save courier settings:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

    // Get Active Couriers
    app.get("/courier/settings", async (req, res) => {
      try {
        const couriers = await courierCollection
          .find({ status: "active" })
          .toArray();
        res.send(couriers);
      } catch (error) {
        console.error("Failed to fetch couriers:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

    // Assign courier & place order to courier API
    app.patch("/orders/:id/courier", async (req, res) => {
      try {
        const { courierName } = req.body;
        const id = req.params.id;

        // Find order
        const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
        if (!order)
          return res
            .status(404)
            .send({ success: false, message: "Order not found" });

        // Find courier
        const courier = await courierCollection.findOne({
          courierName,
          status: "active",
        });
        if (!courier) {
          return res.status(400).send({
            success: false,
            message: "Courier not active or not found",
          });
        }

        // Update order with assigned courier
        await ordersCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              courier: courierName,
              courierStatus: "assigned",
              courierTrackingId: null,
            },
          }
        );

        // Try sending order to courier API
        try {
          const response = await axios.post(
            `${courier.baseUrl}/aladdin/api/v1/orders`,
            {
              order_id: order._id,
              recipient_name: order.fullName,
              recipient_phone: order.phone,
              recipient_address: order.address,
              amount_to_collect: order.total,
            },
            { headers: { Authorization: `Bearer ${courier.apiKey}` } }
          );

          await ordersCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                courierStatus: "placed",
                courierTrackingId: response.data.tracking_id || null,
              },
            }
          );
        } catch (err) {
          console.error("Courier API failed:", err.message);
          await ordersCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: { courierStatus: "failed", courierError: err.message },
            }
          );
        }

        res.send({ success: true, message: "Courier assigned & API updated" });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

    app.post("/whisper", async (req, res) => {
      const { email, productId } = req.body;

      const exists = await whisperCollection.findOne({ email, productId });
      if (exists) {
        return res.send({ message: "Already added" });
      }

      const result = await whisperCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/whisper", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      try {
        const whisperItems = await whisperCollection.find({ email }).toArray();
        res.send(whisperItems);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to get whisper items" });
      }
    });

    // DELETE favourite by id
    app.delete("/whisper/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await whisperCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to delete favourite" });
      }
    });

    app.get("/profit-loss-report", async (req, res) => {
  try {
    // Online orders (delivered only)
    const deliveredOrders = (
      await ordersCollection.find({ status: "delivered" }).toArray()
    ).map((o) => ({
      ...o,
      orderType: "Online",
      cartItems: o.cartItems || [],
      createdAt: o.createdAt || o.date || new Date(),
    }));

    // POS orders
    const posOrders = (await posOrdersCollection.find().toArray()).map((o) => ({
      ...o,
      orderType: "POS",
      cartItems: o.cartItems || [],
      createdAt: o.createdAt || o.date || new Date(),
    }));

    // Combine all
    const allOrders = [...deliveredOrders, ...posOrders];

    // Helper: filter by period
    const filterByDate = (orders, period) => {
      const now = new Date();
      return orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        if (period === "today") {
          return orderDate.toDateString() === now.toDateString();
        } else if (period === "yesterday") {
          const yest = new Date(now);
          yest.setDate(now.getDate() - 1);
          return orderDate.toDateString() === yest.toDateString();
        } else if (period === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return orderDate >= weekAgo;
        } else if (period === "lastWeek") {
          const prevWeekStart = new Date();
          prevWeekStart.setDate(now.getDate() - 14);
          const prevWeekEnd = new Date();
          prevWeekEnd.setDate(now.getDate() - 7);
          return orderDate >= prevWeekStart && orderDate < prevWeekEnd;
        } else if (period === "month") {
          return (
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          );
        } else if (period === "lastMonth") {
          const month = now.getMonth() - 1;
          const year = now.getFullYear();
          return (
            orderDate.getMonth() === month && orderDate.getFullYear() === year
          );
        }
        return true;
      });
    };

    // Helper: calculate totals
    const calcProfitLoss = (orders) => {
      let sales = 0;
      let cost = 0;
      let discount = 0;
      let tax = 0;

      orders.forEach((order) => {
        discount += Number(order.discount || 0);
        tax += Number(order.tax || 0);

        (order.cartItems || []).forEach((p) => {
          const totalSell = Number(p.price) * Number(p.quantity);
          const totalCost = Number(p.purchasePrice || 0) * Number(p.quantity);

          sales += totalSell;
          cost += totalCost;
        });
      });

      const profit = sales - cost - discount + tax;
      return { sales, cost, discount, tax, profit };
    };

    res.send({
      allTime: calcProfitLoss(allOrders),
      thisMonth: calcProfitLoss(filterByDate(allOrders, "month")),
      lastMonth: calcProfitLoss(filterByDate(allOrders, "lastMonth")),
      thisWeek: calcProfitLoss(filterByDate(allOrders, "week")),
      lastWeek: calcProfitLoss(filterByDate(allOrders, "lastWeek")),
      today: calcProfitLoss(filterByDate(allOrders, "today")),
      yesterday: calcProfitLoss(filterByDate(allOrders, "yesterday")),
      allOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to generate profit-loss report" });
  }
});


    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to you in Furniture Website API");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
