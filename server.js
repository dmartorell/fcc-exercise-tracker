require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

try {
  mongoose.connect(
    process.env.DB_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    },
    () => console.log("connected to MongoDB")
  );
} catch (error) {
  console.log("could not connect to MongoDB");
}

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

///--------------------------

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Your app is listening on port ' + port)
})

///_____SCHEMAS_______________________

let exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String, required: true}
});

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema]
});

///_____MODELS_______________________

const Exercise = mongoose.model('Exercise', exerciseSchema)
const User = mongoose.model('User', userSchema)

///_____ROUTES_______________________

app.post('/api/exercise/new-user', async (req, res) => {
  let user = new User({
    username: req.body.username
  });
  data = await user.save();
  res.json({
    username: data.username,
    _id: data.id});

})

app.get('/api/exercise/users', async (req, res) => {
  const data = await User.find().select('username').sort('username');
  res.json(data);
})

app.post('/api/exercise/add', async (req, res) => {
  
  let {userId, description, duration, date} = req.body;
  
  if(date === '') {
    date = new Date().toISOString().slice(0,10)
  }
  const newExercise = new Exercise({
    description: description,
    duration: duration,
    date: date, 
  })
  const response = await User.findByIdAndUpdate(userId, {$push : {log: newExercise}}, {new: true});
  
  res.json({
    _id: response._id,
    username: response.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: new Date(newExercise.date).toDateString(),
  })
});

app.get('/api/exercise/:log', async (req, res) => {
  const {userId} = req.query;
  let fromDate = req.query.from;
  let toDate = req.query.to;
  const limit = req.query.limit;
  
  fromDate = fromDate ? new Date(fromDate).getTime() : new Date(0).getTime();
  toDate = toDate ? new Date(toDate).getTime() : new Date().getTime();

  const response = await User.findById(userId)
  
  if(fromDate || toDate) {

      response.log = response.log.filter(log => {
      let sessionDate = new Date(log.date).getTime();
      return sessionDate >= fromDate && sessionDate <= toDate
    })

  }

  if(limit) {
    response.log = response.log.slice(0,limit);
  }

  let objectResponse = {
    _id: response._id, 
    username: response.username,
    count: response.log.length,
    log: response.log
  }

  res.json(objectResponse)

})




