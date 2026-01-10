const express = require('express') 
require('dotenv').config() 
const cors=require('cors') 

const app = express()
const port = 3000 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_password}@cluster0.e1kqjp5.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(express.json())
app.use(cors()) 


app.get('/', (req, res) => {
  res.send('Hello World!')
})  


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect(); 

    const db=client.db('loan-link') 
    const availableLoan=db.collection('availableLoan') 
    const LoanApplication=db.collection('loanApplication')
    const userCollection=db.collection('users')


     app.post('/users',async(req,res)=>{
        const user=req.body 
        const query={email:user.email}
        const exittingUser=await userCollection.findOne(query) 
        if(exittingUser){
           return res.send({message:'user already exiting',insertedId:null} )
        } 
        const result=await userCollection.insertOne(user) 
        res.send(result)
     }) 

     app.post('/apply-loan',async(req,res)=>{
         const applicatiton=req.body 
           const result=await LoanApplication.insertOne(applicatiton) 
            res.send(result) 
          
          }
        
     ) 

     app.post('/my-loan',async(req,res)=>{
        const email=req.body.email
        const query={userEmail:email}
        const result=await LoanApplication.find(query).toArray()
        res.send(result)
     }) 


     app.get('/my-loan/:email',async(req,res)=>{
        const email=req.params.email
        const query={userEmail:email}
         const result=await LoanApplication.find(query).toArray()
          res.send(result)
     })

     
 
//  get user role
      app.get('/users/role/:email',async(req,res)=>{
         const email=req.params.email
         const query={email:email} 
         const user=await userCollection.findOne(query)
         res.send({role:user?.role})
      })


    app.post('/availableloan',async(req,res)=>{
        const loan=req.body 
        const result=await availableLoan.insertOne(loan)
        res.send(result)
    }) 

    app.get('/availableloan',async(req,res)=>{
        const result=await availableLoan.find().toArray()
        res.send(result)
    }) 

    app.get('/availableloan/:id',async(req,res)=>{
       const id=req.params.id 
       const query={_id:new ObjectId(id)}
       const result=await availableLoan.findOne(query)
       res.send(result)
    })  


     app.get('/users',async(req,res)=>{
        const result=await userCollection.find().toArray() 
         res.send(result)
     }) 

    //  app.get('/users/role/:id',async(req,res)=>{
    //    const id=req.params.id 
    //    const { role } = req.body;
    //     const filter = { _id: new ObjectId(id) };
    //      const updateDoc ={ $set:{ role:role}} 
    //      const result=await userCollection.updateOne(filter,updateDoc)
    //      res.send(result)
    //  }) 

    //  view loan application : manager 

     app.get('/loan-applications',async(req,res)=>{
       const result=await LoanApplication.find().toArray() 
        res.send(result)
     }) 

    //  loan approve or reject : manager

    app.patch('/loan-applications/:id',async(req,res)=>{
       const id=req.params.id 
        const { status } = req.body
    const filter = { _id: new ObjectId(id) } 

      const updateDoc={$set:{status:status}}
       const result=await LoanApplication.updateOne(filter,updateDoc)
       res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
