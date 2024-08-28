const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

    const userCollection = client.db("bloodDb").collection("user");
    const requesterCollection = client.db("bloodDb").collection("request");
    const dashboardCollection = client.db("bloodDb").collection("dashboard");
    const blogCollection = client.db("bloodDb").collection("blogs");
    // const dono rCollection = client.db("bloodDb").collection("donor");



    // jwt related api
app.post('/jwt', async(req, res)=> {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '7h' });
  res.send({ token });
})

// middlewares
const verifyToken = (req, res, next) =>{
  console.log('inside verify token', req.headers.authorization);
  if(!req.headers.authorization){
    return res.status(401).send({message: 'forbidden access'});
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'forbidden access'})
    }
    req.decoded = decoded;
    next();
  })
 
  
}



const verifyAdmin = async(req, res, next)  =>{
     const email = req.decoded.email;
     const query = {email: email};
     const user = await userCollection.findOne(query);
     const isAdmin = user?.role === 'admin';
     if(!isAdmin){
      return res.status(403).send({message: 'forbidden access' })
     }
     next();

}

// const verifyVolunteer = async(req, res, next)  =>{
//   const email = req.decoded.email;
//   const query = {email: email};
//   const user = await userCollection.findOne(query);
//   const isVolunteer = user?.role === 'volunteer';
//   if(!isVolunteer){
//    return res.status(403).send({message: 'forbidden access' })
//   }
//   next();

// }

const verifyVolunteer = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isVolunteer = user?.role === 'volunteer';

  if (!isVolunteer) {
      return res.status(403).send({ message: 'forbidden access' });
  }
  next();
};



// Make a user a volunteer
app.patch('/user/volunteer/:id', verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: 'volunteer'
    }
  };
  const result = await userCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// Route to toggle between 'user' and 'volunteer' roles
app.patch('/user/:role/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { role, id } = req.params;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: role
    }
  };
  const result = await userCollection.updateOne(filter, updateDoc);
  res.send(result);
});


// Check if the user is a volunteer

app.get('/user/volunteer/:email', verifyToken, async (req, res) => {
  const email = req.params.email;
  if (email !== req.decoded.email) {
      return res.status(403).send({ message: 'Unauthorized access' });
  }

  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isVolunteer = user?.role === 'volunteer';

  res.send({ volunteer: isVolunteer });
});




// All Blood Donation Requests
// Endpoint to get all blood donation requests
// app.get('', verifyToken, async (req, res) => {
//   try {
//       const requests = await requesterCollection.find().toArray();
//       res.send({ requests });
//   } catch (error) {
//       res.status(500).send({ message: 'Failed to fetch donation requests', error: error.message });
//   }
// });


// Endpoint to update donation status
// app.put('/dashboard/update-donation-status/:id', verifyToken, async (req, res) => {
//   const id = req.params.id;
//   const { status } = req.body;
//   const filter = { _id: new ObjectId(id) };
//   const updateDoc = {
//       $set: {
//           donationStatus: status
//       }
//   };

//   try {
//       const result = await requesterCollection.updateOne(filter, updateDoc);
//       if (result.modifiedCount > 0) {
//           res.send({ message: 'Donation status updated successfully', result });
//       } else {
//           res.status(404).send({ message: 'Donation request not found or no changes made' });
//       }
//   } catch (error) {
//       res.status(500).send({ message: 'Failed to update donation status', error: error.message });
//   }
// });
//  Endpoint delet
// app.delete('/dashboard/delete-donation-request/:id', verifyToken, async (req, res) => {
//   const id = req.params.id;
//   const filter = { _id: new ObjectId(id) };

//   try {
//       const result = await requesterCollection.deleteOne(filter);
//       if (result.deletedCount > 0) {
//           res.send({ message: 'Donation request deleted successfully' });
//       } else {
//           res.status(404).send({ message: 'Donation request not found' });
//       }
//   } catch (error) {
//       res.status(500).send({ message: 'Failed to delete donation request', error: error.message });
//   }
// });



// app.get('/dashboard/all-blood-donation-request', verifyToken,  async (req, res) => {
//   try {
//       const user = req.user; // Assumes you have middleware that adds the user to the request
//       if (user.role === 'admin' || user.role === 'volunteer') {
//           // Fetch and return requests with pagination and filtering
//           const { page, limit } = req.query; // Pagination parameters
//           const requests = await getRequests({ page, limit });
//           res.json(requests);
//       } else {
//           res.status(403).json({ message: 'Forbidden' });
//       }
//   } catch (error) {
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// Content Management
app.post('/content-management', verifyToken, async (req, res) => {
  try {
      const user = req.user; // Assumes you have middleware that adds the user to the request
      if (user.role === 'admin') {
          // Create or manage content
          const content = req.body;
          const result = await createContent(content);
          res.json(result);
      } else {
          res.status(403).json({ message: 'Forbidden' });
      }
  } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// users related api

app.get('/user', verifyToken, verifyAdmin, async(req, res) =>{
  // console.log(req.headers);
  const result = await userCollection.find().toArray()
  res.send(result);
});


app.get('/user/admin/:email', verifyToken, async(req , res) =>{
  const email = req.params.email;
  if(email !== req.decoded.email) {
    return res.status(403).send({message: 'unauthorization access'})
  }

  const query = {email: email}
  const user = await userCollection.findOne(query);
  let admin = false;
  if(user){
    admin = user?.role === 'admin';

  }
  res.send({ admin });

})



app.post('/user', async (req, res) =>{
  const user = req.body;
  user.status = 'draft';

  const query = {email: user.email}
  const existingUser = await userCollection.findOne(query);
  if(existingUser){
    return res.send({message: 'user already exists', insertedId: null })
  }
  const result = await userCollection.insertOne(user);
  res.send(result);
});


//  users bloack api

app.patch('/user/block/:id', verifyToken, verifyAdmin, async(req, res) =>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      status: 'blocked'
    }
  }
  const result = await userCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// user unblock api

app.patch('/user/unblock/:id', verifyToken, verifyAdmin, async(req, res) =>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      status: 'active'
    }
  }
  const result = await userCollection.updateOne(filter, updateDoc);
  res.send(result);
});



app.patch('/user/admin/:id', verifyToken, verifyAdmin, async(req, res) =>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result = await userCollection.updateOne(filter, updateDoc);
  res.send( result);

} )


app.patch('/user/:role/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { role, id } = req.params;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: role
    }
  };
  const result = await userCollection.updateOne(filter, updateDoc);
  res.send(result);
});



// Delete users
app.delete('/user/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});







    app.post('/request', async (req, res) => {
      const newRequst = req.body;
      newRequst.status = 'draft';
      const result = await requesterCollection.insertOne(newRequst);
      res.send(result);
    });

    app.get('/request',  async (req, res) => {
      try {
        const result = await requesterCollection.find().toArray();
        console.log('All requests:', result);
        res.send(result);
      } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    app.get('/requests', verifyToken, verifyAdmin, async (req, res) => {
      const requests = await requesterCollection.find().toArray();
      res.send(requests);
    });

    // app.get('/requests', verifyToken, verifyVolunteer, async (req, res) => {
    //   const requests = await requesterCollection.find().toArray();
    //   res.send(requests);
    // });

    // Delete Blog
    app.delete('/request/:id', async (req, res) => {
      const { id } = req.params;
      const result = await requesterCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });


    app.delete('/requests/:id', verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const result = await requesterCollection.deleteOne(filter);
      res.send(result);
  });
  
    // update

    app.put('/requests/:id/status', verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status } };
      const result = await requesterCollection.updateOne(filter, updateDoc);
      res.send(result);
  });
  
// update only login user
    app.put('/request/:id', async (req, res) => {
      const id = req.params.id;

      // Validate the ID
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: 'Invalid ID format' });
      }

      const Request = req.body;
      console.log(id, Request);

      // Check if the required fields are provided
      if (!Request.hospitalName) {
        return res.status(400).send({ error: 'Hospital name is required' });
      }

      const filter = { _id: new ObjectId(id) };
      const option = {}; // No upsert option

      const updatedRequest = {
        $set: {
          hospitalName: Request.hospitalName,
          fullAddress: Request.fullAddress,
          donationDate: Request.donationDate,
          donationTime: Request.donationTime,
          donationStatus: Request.donationStatus,
          // Add other fields to update as needed
        },
      };
      try {
        const result = await requesterCollection.updateOne(filter, updatedRequest, option);
        console.log('Update Result:', result);
        res.send(result);
      } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });


    // details
    app.get('/request/:id',  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await requesterCollection.findOne(query);
      res.send(result);
    });




    const districts = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna'];
const upazilas = ['Upazila 1', 'Upazila 2', 'Upazila 3'];

app.get('/districts', (req, res) => {
  res.json(districts);
});

app.get('/upazilas', (req, res) => {
  res.json(upazilas);
});

    app.get('/dashboard', async (req, res) => {
      try {
        const { bloodGroup, district, upazila } = req.query;
        // Assuming you have a function to fetch donors based on these parameters
        const donors = await getDonors({ bloodGroup, district, upazila });
        res.json(donors);
      } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    })





    // Add Blog
    app.post('/blogs',  async (req, res) => {
      const newBlog = req.body;
      newBlog.status = 'draft';
      const result = await blogCollection.insertOne(newBlog);
      res.send(result);
    });


    // Fetch Blogs
    app.get('/blogs',  async (req, res) => {
      const status = req.query.status;
      const query = status ? { status } : {};
      const blogs = await blogCollection.find(query).toArray();
      res.send(blogs);
    });

    // Update Blog Status
    app.put('/blogs/:id/status', verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status } };
      const result = await blogCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete Blog
    app.delete('/blogs/:id', verifyToken, verifyAdmin,  async (req, res) => {
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


    // stats or analytics
    app.get('/admin-stats', verifyToken, verifyAdmin,  async(req, res) =>{
      const user =  await userCollection.estimatedDocumentCount();
      const donor = await dashboardCollection.estimatedDocumentCount();
      const requests = await requesterCollection.estimatedDocumentCount(); 


      // Calculate total donations from the dashboardCollection
    const totalDonations = await dashboardCollection.aggregate([
      {
          $group: {
              _id: null,
              total: { $sum: "$donations" } // Replace "donations" with the actual field name if different
          }
      }
  ]).toArray();

  const donations = totalDonations[0]?.total || 0;
      res.send({
        user,
        donor,
        requests,
        donations
        
      })
    } )




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



app.get('/', (req, res) => {
  res.send('blood is going ')
})

app.listen(port, () => {
  console.log(`blood is sitting on port ${port}`);
})
