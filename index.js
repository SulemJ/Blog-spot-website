import express from "express";
import bodyParser from "body-parser";


const app = express();
const port = 3000;
var titleToEdit = "";
var textToEdit = "";
var shortToEdit = "";
var imgSrcToEdit = "";
var submittedTitle = "";
var submittedText = "";
var submittedShort = "";
var submittedImgSrc = "";


app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));


 var logger = function (req, res, next){
     submittedTitle = req.body["title"] ;
     submittedText =     req.body["blog"];
     submittedShort = req.body["desc"];
     submittedImgSrc = req.body["src"];
    next();
   }
app.use(logger);


//home page
app.get("/", (req, res) => {

    res.render("home.ejs");

});

//write page when write button is clicked
app.get("/write", (req, res) => {  

     res.render("write.ejs");
   
});

//about page rendered when about button is clicked
app.get("/about", (req, res) => {

    res.render("about.ejs");

});

//contact page rendered when about button is clicked
app.get("/contact", (req, res) => {

    res.render("contact.ejs");

});

// when the submit btn in write page is clicked it adds the content in home page and also put it's input for editting purpose
app.post("/submit", (req, res) => {
    
    titleToEdit = submittedTitle;
    textToEdit = submittedText;
    shortToEdit = submittedShort;
    imgSrcToEdit = submittedImgSrc;
    const data = {       
       s: 0, // to activate the content adding process in home page
       title: submittedTitle,
       paragraph: submittedText,
       short: submittedShort, 
       imgSrc: submittedImgSrc,
    };
    res.render("home.ejs", data);
    
});

// when the edit btn in home page is clicked it opens write page with the content thats already in it
app.get("/edit", (req, res) => {

    const how = {
       title: titleToEdit,
       paragraph: textToEdit, 
       short: shortToEdit,
       imgSrc: imgSrcToEdit,
    };
    res.render("write.ejs", how);
     
});

// when delete btn in home page is clicked it immediately refresh the home page and removes the content submitted by client
app.post("/delete", (req, res) => {

    res.render("home.ejs");

});

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
app.get("/added", (req, res) => {
    const info = {
        title: titleToEdit,
        paragraph: textToEdit, 
        short: shortToEdit,
     };
    res.render("added.ejs", info);

});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });