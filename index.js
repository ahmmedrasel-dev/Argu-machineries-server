const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8uagw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Not Allow! Unauthorization Access!' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decode) {
    if (error) {
      return res.status(403).send({ message: 'Not Allow! Forbidden Access!' })
    }

    req.decode = decode;
    next()
  })
}


async function run() {
  try {
    await client.connect();
    const userCollection = client.db('argo_machineries').collection('users');
    const contactInfoCollection = client.db('argo_machineries').collection('concat_info');
    const productCollection = client.db('argo_machineries').collection('products');
    const oderCollection = client.db('argo_machineries').collection('orders');
    const reviewCollection = client.db('argo_machineries').collection('reviews');
    // User update and creta token
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateUser = {
        $set: user,
      }
      const result = await userCollection.updateOne(filter, updateUser, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    })

    // User Register Collection.
    app.post('/user', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    })

    // Get All Users:
    app.get('/users', verifyJWT, async (req, res) => {
      const query = {};
      const users = await userCollection.find(query).toArray();
      res.send(users);
    })

    // Delete User
    app.delete('/user/:id', verifyJWT, async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result)
    })

    // Contact Information:
    app.post('/contact', async (req, res) => {
      const contactInfo = req.body;
      const result = await contactInfoCollection.insertOne(contactInfo);
      res.send({ success: true, message: 'Message Send Successfully!' })
    })

    // Add product to databse.
    app.post('/add-product', async (req, res) => {
      const product = req.body;
      await productCollection.insertOne(product);
      res.send({ success: true, message: 'Product Create Successfully!' })
    })

    // Get all products 
    app.get('/all-products', async (req, res) => {
      const query = {};
      const products = await productCollection.find(query).toArray()
      res.send(products)
    })

    // Get Signle Product;
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const product = await productCollection.findOne(query);
      res.send(product)
    })

    // Delete Products
    app.delete('/product/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      console.log(id)
      // const query = { _id: ObjectId(id) };
      // const reault = await productCollection.deleteOne(query);
      // res.send(reault)
    })

    // Product Oder.
    app.post('/oder', verifyJWT, async (req, res) => {
      const order = req.body;
      await oderCollection.insertOne(order);
      res.send({ success: true, message: 'Order Placed Successfully' });
    })

    // Individual Customer Orders.
    app.get('/order/:email', verifyJWT, async (req, res) => {
      const email = req.params.email
      const query = { customer_email: email };
      const orders = await oderCollection.find(query).toArray()
      res.send(orders);
    })

    // Customer Review Post,
    app.post('/review', async (req, res) => {
      const review = req.body;
      await reviewCollection.insertOne(review);
      res.send({ success: true, message: 'Review Submited Successfully' });
    })

    app.get('/reviews', async (req, res) => {
      const query = {};
      const reviews = await reviewCollection.find(query).toArray();
      res.send(reviews);
    })

  }
  finally {
    // await client.close()/
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Argo Machineries Server Runnin from ${port}`)
})