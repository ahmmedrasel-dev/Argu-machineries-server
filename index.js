const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

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
  const token = authHeader.slpit(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decode) {
    if (err) {
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

    // User Register Collection.
    app.post('/user', async (req, res) => {
      const user = req.body;
      // console.log(user)
      const result = await userCollection.insertOne(user);
      const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
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
      const result = await productCollection.insertOne(product);
      res.send({ success: true, message: 'Product Create Successfully!' })
    })

    // Get all products 
    app.get('/all-products', async (req, res) => {
      const query = {};
      const products = await productCollection.find(query).toArray()
      res.send(products)
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