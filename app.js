//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const path = require('path');
const { strict } = require('assert');

const app = express();

app.use("/public",express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// Authentication

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);
var conn=mongoose.Collection;

// Login Schema

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

// Workers Schema

const employeeSchema=new mongoose.Schema({
  first_name:String,
  last_name:String,
  mobile:Number,
  adhaar:Number
});

// Company Details Schema

const companySchema=new mongoose.Schema({
  job_type:String,
  work:String,
  location:String,
  budget:Number
});

// Company types Schema

const DetailSchema=new mongoose.Schema({
  company_name:String,
  job_type:String,
  location:String,
  pay:Number,
  time:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

const empModel=new mongoose.model("Employee",employeeSchema);
const employee=empModel.find({});

const companyModel=new mongoose.model("Company",companySchema);
const company=companyModel.find({});

const DetailModel=new mongoose.model("Detail",DetailSchema)
const description=DetailModel.find({});

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: "560768197808-mur1p64ibglu85dndtbrf7qhdioa82i6.apps.googleusercontent.com",
  clientSecret: "7OOLrGhqBgWoO1XBVBXhGO8q",
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Get functions

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/link",function(req,res,next){
  description.exec(function(err,data){
    if(err) throw err;
    res.render('link',{title:'Company Details',records:data});
  });
});

app.get("/apply",function(req,res){
  res.render("apply");
});

app.get("/hire",function(req,res){
  res.render("hire");
});

app.get("/infoSubmit",function(req,res){
  res.render("infoSubmit");
});

app.get("/home", function (req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  User.find({ "secret": { $ne: null } }, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      }
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// Post Functions

app.post("/register", function (req, res) {

  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  console.log(process.env.CLIENT_ID)
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
        console.log(res);
      });
    }
  });
});

app.post("/apply",function(req,res,next){
  var empDetails=new empModel({
    first_name:req.body.fname,
    last_name:req.body.lname,
    mobile:req.body.mob,
    adhaar:req.body.adhaar
  });


 empDetails.save(function(err,req1){
    if(err) throw err;
    employee.exec(function(err,data){
      if(err) throw err;
      res.render('apply', { title: 'Employee Records', records:data, success:'Record Inserted Successfully' });
        });
  })
});

app.post("/hire",function(req,res,next){
  var companyDetails=new companyModel({
    job_type:req.body.job,
    work:req.body.course,
    location:req.body.location,
    budget:req.body.budget
  });


 companyDetails.save(function(err,req1){
    if(err) throw err;
    company.exec(function(err,data){
      if(err) throw err;
      res.render('hire', { title: 'Company Records', records:data, success:'Record Inserted Successfully' });
        });
  })
});

app.post("/link",function(req,res,next){
  var companyDescription=new DetailModel({
    company_name:req.body.cname,
    job_type:req.body.job,
    location:req.body.loc,
    pay:req.body.payment,
    time:req.body.time
  });


  companyDescription.save(function(err,req2){
    if(err) throw err;
    description.exec(function(err,data){
      if(err) throw err;
      res.render('link', { title: 'Company Details Records', records:data, success:'Record Inserted Successfully' });
      });
  })
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});

