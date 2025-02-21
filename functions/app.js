const express = require('express');
const path = require('path');
const app = express();
const serverless = require("serverless-http");
const router = express.Router();
const userModel = require("../models/user");
const bcrypt = require('bcrypt');
const jwt= require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer  = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      return cb(null,"./uploads");
    },
    filename: function (req, file, cb) {
      return cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
  
const upload = multer({ storage })

app.set('view engine','ejs');
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

router.get('/',(req,res)=>{
    res.render("index")
})
router.get("/folder",(req,res)=>{
    res.render("folder")
})

router.get("/test",(req,res)=>{
    res.render("test");
})

router.get("/logout",(req,res)=>{
    res.clearCookie("token")
    res.redirect("./login")
})

router.get("/login",(req,res)=>{
    res.render("login");
})
router.get("/profile",isloggedIn,async(req,res)=>{
    let {email} = req.body;
    let user = await userModel.findOne({email:email})
    res.render("profile",{user})
})

router.post("/upload",upload.single('image'),(req,res)=>{
    console.log(req.body);
    console.log(req.file);
})

 router.post("/register",async(req,res)=>{
     let {name,age,email,password} = req.body;
    let user = await userModel.findOne({email});
    if (user){
     res.send("User already exists")
    }
    else{
        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(password,salt,async(err,hash)=>{
                let user =   await userModel.create({
                    name,age,email,password:hash
                })
                let token = jwt.sign({ email: email, userid: user._id }, "shhhhhh");
                res.cookie("token", token);
                res.send("Registered");


            })
        })
     
    }
 })



router.post("/login", async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("Something went wrong");

    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhhhhh");
            res.cookie("token", token);
            res.redirect("/profile");
        } else {
            res.redirect("/login");
        }
    });
});

function isloggedIn(req,res,next){
    if(req.cookies.token){
        let data = jwt.verify(req.cookies.token,"shhhhhh")
        req.user = data;
        next()
    }else{
        res.send("authorized");
    }
}
app.use("/.netlify/functions/app", router);
module.exports.handler = serverless(app);