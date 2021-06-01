
const Users = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendMail = require('./sendMail')
const { CLIENT_URL } = process.env;



const userCtrl = {
    register: async (req, res) => {
        try {
            const { name , email, password } = req.body;
           
            //console.log("name", name, "email",email, "password", password)
            if(!name || !email || !password)
                return res.status(400).json({msg: "Please fill in all the fields"})
            
            
            if(!validateEmail(email))
                return res.status(400).json({ msg: "Invalid Email" })
            
            const user = await Users.findOne({email})

            if(user) return res.status(400).json({msg: "This Email already exists!"})

            if(password.length < 6)
                return res.status(400).json({msg: "Password must be at least 6 characters."})

            const passwordHash = await bcrypt.hash(password, 12);
            
            const newUser = {
                name, email, password:passwordHash
             }

             const activation_token = createActivationToken(newUser)
            
             const url = `${CLIENT_URL}/user/activate/${activation_token}`
             sendMail(email, url, "Verify your email Address")


            res.json({
                msg: "Register Success@ Please activate your email to start."
            })
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    activateEmail: async (req, res) => {
        try {
            const { activation_token } = req.body
            const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET);

            const { name, email, password } = user

            const check = await Users.findOne({email});

            if(check) return res.status(400).json({msg: "This email Already Exists"})

            const newUser = new Users({
                name:name,
                email: email,
                password: password,
            })

            await newUser.save();
            res.json({
                message: "Account has been Activated"
            });
    
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    login: async (req, res) => {
   
        try {
            const { email, password } = req.body;

            const user = await Users.findOne({ email });

            if(!user) return res.status(400).json({msg: "This email does not exist."})

            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch) return res.status(400).json({msg: "Password is incorrect."})

            const refresh_token = createRefreshToken({id: user._id})
            
            res.cookie('refreshtoken', refresh_token, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 // 7 days
            })

          return res.json({msg: "Login success"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    
    },
    getAccessToken: async (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken
            if(!rf_token) return res.status(400).json({msg: "Please Login now!"})

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if(err) return res.status(400).json({msg: "Please Login now!"})            
                const access_token = createAccessToken({ id: user.id })
                res.json({ access_token })
            })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    }, 
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await Users.findOne({email});
            if(!user) return res.status(400).json({msg: "This email does not exist"});
            
            const access_token = createAccessToken({id: user._id})
            const url = `${CLIENT_URL}/user/reset/${access_token}`
            sendMail(email,url, "Reset your Password.");
            console.log('i am the back back back')
            res.json({ msg: 'Re-set the password, please check your email.' })
        } catch (err) {
            console.log('try ;try try try try ')
            return res.status(500).json({msg: err.message})
        }
    },
    resetPassword: async (req, res) => {
        try {
            const { password } = req.body;
            if(!password) return res.status(400).json({msg: "Password cannot be empty"})
     
             const passwordHash = await bcrypt.hash(password, 12);
          
            await Users.findOneAndUpdate({ _id: req.user.id }, {
                password: passwordHash
            });

            res.json({ msg: "Password successfully changed!"})

        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    getUserInfor: async (req, res) => {
        const { id } = req.user
        try {
            const user = await Users.findById(id).select('-password');
            res.json(user)

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    getUserAllInfor: async (req, res) => {
        try {
            const users = await Users.find().select('-password')
            res.json(users)
        } catch (err) {
            return res.status(500),json({msg: err.message})
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path:'/user/refresh_token' })
            res.json({ msg: "Logged out." })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    updateUser: async (req, res) => {
        try {
            const { name, avatar }= req.body
            await Users.findOneAndUpdate({ _id: req.user.id }, {
                name, avatar
            })
            res.json({
                msg: "Update Success"
            })
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    updateUserRole: async (req, res) => {
        try {
            const { role } = req.body;
            await Users.findOneAndUpdate({_id: req.params.id}, {
                role:role
            });

            res.json({msg: "Role Updated"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    deleteUser: async (req, res) => {
        try {
            await Users.findByIdAndDelete({ _id: req.params.id })
            res.json({msg: "Deleted User"})
        } catch (err) {
            console.log(err)
            return res.status(500).json({msg :err.message + "this user"})
        }
    }
};


//create JWT Token 

const createActivationToken = (payload) => {
    return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {expiresIn: '5m'})
}
const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'})
}
const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}

//validate Email

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports = userCtrl;

