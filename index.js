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
 





// admin sdk 
var admin = require("firebase-admin");

var serviceAccount = require("./loan-link-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.get('/', (req, res) => {
  res.send('Hello World!')
})   


const verifyToken=async(req,res,next)=>{
    const authorization=req.headers.authorization 
       if(!authorization){ 
           return res.status(401).send({message:'unauthorized access'})
} 
    const token=authorization.split(' ')[1]  
     try{
        const decodedUser=await admin.auth().verifyIdToken(token)
         req.decodedUser=decodedUser
          next() 
     } 
     catch(error){
        return res.status(401).send({message:'unauthorized access'})
     }
}



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

     app.patch('/users/:id',async(req,res)=>{
         const id=req.params.id 
         const {role}=req.body 
         const filter={_id:new ObjectId(id)} 
          const updateDoc={
             $set:{
                role:role
             }
          } 
          const result=await userCollection.updateOne(filter,updateDoc)
          res.send(result)
          
     })

     app.post('/apply-loan',verifyToken,async(req,res)=>{
         const applicatiton=req.body 
           if(!applicatiton.userEmail){
              return res.status(400).send({message:'user email is required'})
           }
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


     app.get('/my-loan/:email',verifyToken,async(req,res)=>{
        const email=req.params.email 
        const decodedEmail=req.decodedUser.email 
         if(email !==decodedEmail){
             return res.status(403).send({message:'forbidden access'})
         }
        const query={userEmail:email}
         const result=await LoanApplication.find(query).toArray()
          res.send(result)
     })

     
 
//  get user role
      app.get('/users/role/:email',async(req,res)=>{
         const email=req.params.email
         const query={email:email} 
         const user=await userCollection.findOne(query)
         res.send({role:user?.role , status:user?.status})
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

    app.get('/availableloan/:id',verifyToken,async(req,res)=>{
       const id=req.params.id 
       const decodedEmail=req.decodedUser.email
         if(!decodedEmail){
             return res.status(403).send({message:'Forbidden Access'})
         }
       const query={_id:new ObjectId(id)}
       const result=await availableLoan.findOne(query)
       res.send(result)
    }) 

    app.patch('/availableloan/show-on-home/:id',async(req,res)=>{
        const id=req.params.id 
        const {showOnHome}=req.body
         const filter={_id:new ObjectId(id)}
         const updateDoc={
              $set:{
                   showOnHome:showOnHome
              }
         } 
         const result=await availableLoan.updateOne(filter,updateDoc)
         res.send(result)
    })  

    // filter loans for the home page  
     app.get('/home-loans',async(req,res)=>{
        const query={ showOnHome:true}
        const result=await availableLoan.find(query).limit(6).toArray() 
        res.send(result)
     })

     
    // view manager added loan
    app.get('/availableloan/manager/:email',async(req,res)=>{
       
       const email=req.params.email 
       const query={ createdBy:email }
       const result=await availableLoan.find(query).toArray()
       res.send(result) 




    }) 

    app.delete('/availableloan/:id',async(req,res)=>{
        const id=req.params.id 
        const query={_id:new ObjectId(id)}
        const result=await availableLoan.deleteOne(query)
        res.send(result)
    }) 




     app.get('/users',async(req,res)=>{
        const result=await userCollection.find().toArray() 
         res.send(result)
     }) 

 

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

      const updateDoc={
        $set:{
          status:status, 
            approvedAt: status==='Approved'? new Date().toDateString():null,  }
    }
       const result=await LoanApplication.updateOne(filter,updateDoc) 
       res.send(result)
    }) 
  
   app.patch(`/availableloan/:id`,async(req,res)=>{
        const id=req.params.id
        const updateData=req.body
        const filter={_id:new ObjectId(id)}
         const updateDoc={
          $set:{
             title:updateData.title,
             interestRate:updateData.interestRate,
             category:updateData.category,
             maxlimit:updateData.maxlimit
          }
         } 
         const result=await availableLoan.updateOne(filter,updateDoc) 
         res.send(result)
   })  

  //  admin dashboard statistics 
   
  app.patch('/users/role/:id',async(req,res)=>{
      const id=req.params.id 
       const { role }=req.body 
       const filter={_id:new ObjectId(id)}
        const updateRoleDoc={
            $set:{
                role:role
            }
        } 
        const result=await userCollection.updateOne(filter,updateRoleDoc)
        res.send(result)
  })  

  app.patch('/users/update/:id',async(req,res)=>{
     const id=req.params.id 
     const {role,status}=req.body  
      const filter={_id:new ObjectId(id)}
         const updateDoc={
               $set:{
                  ...(role && {role:role}),
                  ...(status && {status:status})
               } 
                
         } 
         const result=await userCollection.updateOne(filter,updateDoc)
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
