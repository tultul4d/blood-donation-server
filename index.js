const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;





// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z5g3hgw.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const requesterCollection = client.db("bloodDb").collection("request");
    const dashboardCollection = client.db("bloodDb").collection("dashboard");
    const blogCollection = client.db("bloodDb").collection("blogs");
    // const donorCollection = client.db("bloodDb").collection("donor");
    

    app.post('/request', async (req, res) => {
      const newRequst = req.body;
      newRequst.status = 'draft';
      const result = await requesterCollection.insertOne(newRequst);
      res.send(result);
  });

    app.get('/request', async (req, res) => {
      try {
        const result = await requesterCollection.find().toArray();
        console.log('All requests:', result);
        res.send(result);
      } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).send('Internal Server Error');
      }
    });


    
    
    // app.get('/request/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   try {
    //     const result = await requesterCollection.findOne(query);
    //     console.log(`Request ${id}:`, result);
    //     if (!result) {
    //       return res.status(404).send('Request not found');
    //     }
    //     res.send(result);
    //   } catch (error) {
    //     console.error(`Error fetching request ${id}:`, error);
    //     res.status(500).send('Internal Server Error');
    //   }
    // });


    // details
  app.get('/request/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await requesterCollection.findOne(query);
    res.send(result);
});
    


    // app.get('/request/:id', async (req, res) => {
    //   try {
    //     const { id } = req.params;
    //     const objectId = new ObjectId(id);
    //     const request = await requesterCollection.findOne({ _id: objectId });

    //     if (!request) {
    //       return res.status(404).json({ error: 'Request not found' });
    //     }

    //     res.json(request);
    //   } catch (err) {
    //     console.error('Error fetching request by ID:', err);
    //     res.status(500).json({ error: 'Internal Server Error' });
    //   }
    // });



   // Route to update a request by ID
  //  app.put('/request/:id', async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const objectId = new ObjectId(id);
  //     const { donorName, donorEmail } = req.body;

  //     const result = await requesterCollection.updateOne(
  //       { _id: objectId },
  //       { $set: { donationStatus: 'inprogress', donorName, donorEmail } }
  //     );

  //     if (result.modifiedCount === 0) {
  //       return res.status(404).json({ error: 'Request not found or already updated' });
  //     }

  //     const updatedRequest = await requesterCollection.findOne({ _id: objectId });
  //     res.json(updatedRequest);
  //   } catch (err) {
  //     console.error('Error updating request:', err);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });

    

    // app.get('/request/:id', async(req, res) =>{
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId (id)}


    //   // const options = {
    //   //   projection: { title:1, name: 1, 
    //   //     photo: 1, 
    //   //     reason: 1, 
    //   //     createdAt: 1 },
    //   // }
    //   const result = await requesterCollection.findOne(query, options)
    //   res.send(result);
    // })
   

    
    

    app.get('/dashboard', async(req, res) =>{
        const result = await dashboardCollection.find().toArray();
        res.send(result);
    })




 
          // Add Blog
          app.post('/blogs', async (req, res) => {
            const newBlog = req.body;
            newBlog.status = 'draft';
            const result = await blogCollection.insertOne(newBlog);
            res.send(result);
        });


        // Fetch Blogs
        app.get('/blogs', async (req, res) => {
          const status = req.query.status;
          const query = status ? { status } : {};
          const blogs = await blogCollection.find(query).toArray();
          res.send(blogs);
      });

       // Update Blog Status
       app.put('/blogs/:id/status', async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status } };
        const result = await blogCollection.updateOne(filter, updateDoc);
        res.send(result);
    });

     // Delete Blog
     app.delete('/blogs/:id', async (req, res) => {
      const { id } = req.params;
      const result = await blogCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
  });
  // details
  app.get('/blogs/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await blogCollection.findOne(query);
    res.send(result);
});




// // donor 

// app.post('/donor', async (req, res) => {
//   const newDonor = req.body;
//   newDonor.status = 'draft';
//   const result = await donorCollection.insertOne(newDonor);
//   res.send(result);
// });


// app.get('/donor', async (req, res) => {
//   const status = req.query.status;
//   const query = status ? { status } : {};
//   const donors = await donorCollection.find(query).toArray();
//   res.send(donors);
// });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
res.send('blood is going ')
})

app.listen(port, () =>{
    console.log(`blood is sitting on port ${port}`);
})
