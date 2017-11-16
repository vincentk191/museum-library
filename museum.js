//-----------------DEPENDENCIES------------------
const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const session = require('express-session')
const SequelizeStore = require('connect-session-sequelize')(session.Store);

//-----------------CONFIGURATION------------------
const sequelize = new Sequelize ('relationships',process.env.POSTGRES_USER,null,{
   host:'localhost',
   dialect:'postgres',
   storage: './session.postgres'
});

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
   extended: false
}));

app.set('view engine', 'pug');

//-----------------SESSION STORE-------------------
// app.use(session({
//   store: new SequelizeStore({
//     db: sequelize,
//     checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds.
//     expiration: 24 * 60 * 60 * 1000 // The maximum age (in milliseconds) of a valid session.
//   }),
//   secret: "safe",
//   saveUnitialized: true,
//   resave: false
// }))
//-----------------TABLES------------------
const Museum = sequelize.define('museums', {
   name: {
      type: Sequelize.TEXT,
      unique: true
   },
   info: Sequelize.TEXT
},{
   timestamps: false
})

const Item = sequelize.define('items', {
   name: Sequelize.TEXT,
   info: Sequelize.TEXT
})

// const User = sequelize.define('users', {
//    username: Sequelize.TEXT,
//    password: Sequelize.TEXT
// })

//-----------------RELATIONSHIPS------------------

Museum.hasMany(Item);
Item.belongsTo(Museum);

sequelize.sync();

//---------------------ROUTES---------------------
// Index route
app.get('/', (req, res) => {
   Promise.all([
      Museum.findAll(),
      Item.findAll({
         include: [{
            model: Museum
         }]
      })
   ]).then(data => {
      res.render('index', {file: 'Home', museums: data[0], pieces: data[1]});
   })
});

app.get('/addPost/:name',(req,res) => {
   const category = req.params.name;
   const categoryList = [
      {
         page: 'Piece',
         first: 'Name',
         second: 'Info'
      },
      {
         page: 'Museum',
         first: 'Name',
         second: 'Country'
      },
      {
         page: 'Assign',
         first: 'Item',
         second: 'Museum'
      }
   ];

   const routeThis = categoryList.find(element => element.page === category);

   res.render('add',{first: routeThis.first, second: routeThis.second, category: category})

   // May implement switch functionality to clean up
});

app.post('/addPost/Piece',(req,res) => {
   const name = req.body.Name;
   const info = req.body.Info;

   Item.create({
      name: name,
      info: info
   }).then(() => {
      res.redirect('/');
   })
});

app.post('/addPost/Museum',(req,res) => {
   const name = req.body.Name;
   const country = req.body.Country;

   Museum.create({
      name: name,
      info: country
   }).then(() => {
      res.redirect('/');
   })
});

app.post('/addPost/Assign',(req,res) => {
   const item = req.body.Item;
   const museum = req.body.Museum;

   Promise.all([Museum.findOne({
      where: {
         name: museum
      }
   }), Item.findOne({
      where: {
         name: item
      }
   })])
   .then((result)=>{
      if(result[0] !== null && result[1]!== null ){
         result[1].updateAttributes({
            museumId: result[0].id
         });
      }
   })
   .then(() => {
      res.redirect('/');
   }).catch((err)=>{console.error(err)});
});

// app.get('/login', (req,res) => {
//    res.render('login',{first: 'Name',second: 'Country'});
// });

// app.post('/login', (req,res) => {
//    res.redirect(`/${userID}`,{file});
// });
//
// app.get('/:loginID', (req,res) => {
//    res.render('',{file});
// });
//
// app.get('/signup',(req,res) => {
//    res.render('signup', {first: 'Name',second: 'Country'});
// });
//
// app.post('/signup',(req,res) => {
// });
//
// app.get('/signout',(req,res) => {
//    res.render('signup', {first: 'Name',second: 'Country'});
// });

var server = app.listen(3000, () => {
   console.log(`Server's working just fine on port 3000!`);
});
