if(process.env.NODE_ENV != "production"){
require("dotenv").config();
}

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

//ROUTES
const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

async function main() {
  try {
    await mongoose.connect(dbUrl, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB Atlas");

    const store = MongoStore.create({
      client: mongoose.connection.getClient(),
      crypto: {
        secret: process.env.SECRET,
      },
      touchAfter: 24 * 3600,
    });

    store.on("error", (err) => {
      console.log("ERROR IN MONGO SESSION STORE", err);
    });

     app.use(
      session({
        store,
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: "lax", 
          secure: process.env.NODE_ENV === "production",
        },
      })
    );

    app.use(flash());
  } catch (err) {
    console.error(" MongoDB connection error:", err);
  }
}

main();


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
res.locals.success=req.flash("success");
res.locals.error=req.flash("error");
res.locals.currUser = req.user;
next();
});


app.get("/", (req, res) => {
    res.redirect("/listings");
});


app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

  //Page not found(Middleware)
    app.all("*", (req, res, next) => {
       next(new ExpressError(404, "Page not found"));
     });

//Error handling Middleware
app.use((err,req,res,next)=>{
    if(res.headersSent){
        return next(err);
    }
    let{statusCode=500, message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{ message });
});

 app.listen(8080,()=>{
    console.log("Server is listening to port 8080");
 });
