const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ig2b4pm.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const toysCollection = client.db("playfulDelights").collection("allToys");

    const indexKeys = { toyName: 1, toyCategory: 1 };
    const indexOptions = { name: "nameCategory" };

    const result = await toysCollection.createIndex(indexKeys, indexOptions);

    app.get("/allToys", async (req, res) => {
      const cursor = toysCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allToys/:category", async (req, res) => {
      const result = await toysCollection
        .find({ toyCategory: req.params.category })
        .toArray();
      res.send(result);
    });

    app.get("/getToysByText/:text", async (req, res) => {
      const text = req.params.text;
      const result = await toysCollection
        .find({
          $or: [
            { toyName: { $regex: text, $options: "i" } },
            { toyCategory: { $regex: text, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    app.get("/allToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    });

    app.get("/myToys/:email", async (req, res) => {
      const result = await toysCollection
        .find({ sellerEmail: req.params.email })
        .toArray();
      res.send(result);
    });

    app.post("/addToy", async (req, res) => {
      const body = req.body;
      const result = await toysCollection.insertOne(body);
      res.send(result);
    });

    app.put("/updatedToy/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          toyName: body.toyName,
          toyPictureUrl: body.toyPictureUrl,
          rating: body.rating,
          price: body.price,
          description: body.description,
          availableQuantity: body.availableQuantity,
        },
      };
      const result = await toysCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/remove/:id", async (req, res) => {
      const result = await toysCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
