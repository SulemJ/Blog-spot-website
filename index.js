import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import session from "express-session";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";


const app = express();
const port = 3000;
const saltround = 10;
env.config();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
      maxAge: 1000 * 60 * 60 *24,
    },
  })
);
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
db.connect();



//  This function gives us id of a user when we provide the name of the user
async function getUserId(name){
    try {
       const result = await db.query(`SELECT id FROM users WHERE name = '${name}'`);
      const userId = result.rows[0].id;
      console.log(userId);
      return userId;
    } catch (error) {
      console.error("Failed to make request:", error.message);
      res.render("write.ejs", {
        message: "check the name and try again",
      })
  
    }
  };

//  This function gives us all the blogs and order them by name of the writter
  async function getBlog(){
    const result = await db.query("select * from users join blogs on (users.id = user_id) order by name ;");
    const blogs = [];
    result.rows.forEach( element => {
    blogs.push(element);
     });
    return blogs;
   }

//home page
app.get("/", async (req,res) => {
  const blogs = await getBlog();
  res.render("home.ejs", {
     listItems: blogs,
   });
 });

//write page when write button is clicked
app.get("/write", (req, res) => {
    if(req.isAuthenticated()){
      res.render("write.ejs");
    } else {
        res.render("signup.ejs");
    }
  });

  // this function adds new users to our database when the sign up btn is pushed
  app.post("/new", async (req, res) =>{
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
   
    try {
      const result = await db.query(`select * from users where email = '${email}'`);   
      if(result.rows.length > 0){
        res.send("Email already exists. Try logging in.");
      }else {
        bcrypt.hash(password, saltround,  async (err, hash) =>{
        if(err){ 
          console.log("error while hashing password", err);
        }else{
          try {
              const newuser = await db.query(`insert into users(name, email, password) values('${name}', '${email}', '${hash}') RETURNING *;`)       
              const user = newuser.rows[0];
                res.render("write.ejs");
              } catch (error) {
                res.send(error, "please check you email and try again");
              }
        }
       })
      }
    } catch (error) {
      res.send(error, "please try again");
    }
  });
  
  // this verify and allow a user that have already an account
  app.post(
    "/signin",
    passport.authenticate("local", {
      successRedirect: "/write",
      failureRedirect: "/signup",
    })
  );

//about page rendered when about button is clicked
app.get("/about", (req, res) => {

    res.render("about.ejs");

});

//contact page rendered when about button is clicked
app.get("/contact", (req, res) => {

    res.render("contact.ejs");

});

// when the submit btn in write page is clicked it adds the content in home page and also put it's input for editting purpose
app.post("/submit", async (req, res) => {
    
        try{
        let str = req.body.name; 
            const userId = await getUserId(str);
            const title = req.body.title;
            const src = req.body.src;
            const description = req.body.desc;
            const blog = req.body.blog;
        await db.query(`insert into  blogs(title, src, prompt, blog, user_id) values('${title}','${src}','${description}', '${blog}' ,${userId})`);    
        res.redirect("/");
      } catch (error) {
        console.error("Failed to make request:", error.message);
        res.render("write.ejs", {
          message: "please check your name and try again",
        })
      }
   
});

// when the edit btn in home page is clicked it opens write page with the content thats already in it
app.post("/edit", async (req, res) => {

  let str = req.body.ItemId;
  console.log(str);
  let result = await db.query(`select * from blogs where id = ${str}`);
  let paragraph = result.rows[0].blog;
  let short = result.rows[0].prompt;
  let title = result.rows[0].title;
  const info = {
            title: title,
            paragraph: paragraph, 
            short: short,
            id: str
         };
        res.render("edit.ejs", info);
    
});
// this function put the changed/ editted blog in the database
app.post("/change", async (req, res) => {
  if(req.isAuthenticated()){
  let id = req.body.ItemId;
  const title = req.body.title;
  const src = req.body.src;
  const description = req.body.desc;
  const blog = req.body.blog;
  try{
  console.log(id);
  await db.query(`UPDATE blogs SET title = '${title}', src='${src}', prompt='${description}',  blog='${blog}' WHERE id = ${id}   `);    
  res.redirect("/");
    }catch (error) {
      console.error("Failed to make request:", error.message);
      res.render("write.ejs", {
        message: "please name and try again",
      })
    }
  }else{
    res.render("signup.ejs");
  }
});

// delete a blog 
app.post("/delete", async (req, res) => {
  // Now we have access to req.user
  // we can access the logged-in user's info from req.user
  if(req.isAuthenticated()){
    const postId = req.body.ItemId;
    const userId = req.user.id; 
       await db.query(`delete from blogs where id = ${postId}`);
    res.redirect("/");
  }else{
    res.render("signup.ejs");
  }
});

app.get("/mine", async (req, res) => {
  if(req.isAuthenticated()){
      const userId = req.user.id; 
      let review = await  db.query(`select * from blogs where user_id = ${userId};`)
      const reviewList = [];
      review.rows.forEach( element => {
      reviewList.push(element);
    });
    if(reviewList.length == 0){
      res.render("write.ejs", {
        message: "you don't have a review yet, add one here!",
      })
    }else{
      res.render("mine.ejs", {
      listItems: reviewList,
    });
    }
  }else{
    res.render("signup.ejs");
  }
});

// when the blog is clicked this get's the blog and display it in added.ejs
app.post("/added", async(req,res)=>{
  let str = req.body.ItemId;
  console.log(str);
  let result = await db.query(`select * from blogs where id = ${str}`);
  let paragraph = result.rows[0].blog;
  let short = result.rows[0].prompt;
  let title = result.rows[0].title;
  const info = {
            title: title,
            paragraph: paragraph, 
            short: short,
         };
        res.render("added.ejs", info);
 });
// This are the blogs that here and not in the db so that they will still show up even if the db failed
app.get("/first", (req, res) => {

    res.render("first.ejs");

});
app.get("/second", (req, res) => {

    res.render("second.ejs");

});
app.get("/third", (req, res) => {

    res.render("third.ejs");

});
app.get("/fourth", (req, res) => {

    res.render("fourth.ejs");

});
app.get("/fifth", (req, res) => {

    res.render("fifth.ejs");

});
app.get("/sixth", (req, res) => {

    res.render("sixth.ejs");

});
app.get("/seventh", (req, res) => {

    res.render("seventh.ejs");

});
passport.use(
    "local",
    new Strategy(async function verify(username, password, cb)  {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
         username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        res.send(err, "please try again");
      }
    })
  );
  
  passport.serializeUser((user, cb)=>{ cb(null, user);});
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });
  
  
  
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });