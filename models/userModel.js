const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name!"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Please enter your email!"],
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: [true, "Please enter your password!"],
        trim: true,
        unique: true
    },
    role: {
        type: Number,
        default: 0 // 0 = user 1 = admin
    },
    avatar: {
        type: String,
        default: "https://www.google.com/imgres?imgurl=https%3A%2F%2Fwww.thewrap.com%2Fwp-content%2Fuploads%2F2021%2F04%2Fwhat-happened-to-scorpion-at-the-end-of-mortal-kombat.jpg&imgrefurl=https%3A%2F%2Fwww.thewrap.com%2Fmortal-kombat-what-happened-to-scorpion%2F&tbnid=670oiuRTBswgqM&vet=12ahUKEwiOqtPwnb7wAhVSlJ4KHavGDpAQMygCegUIARDZAQ..i&docid=EC_DHaMWrQPcJM&w=1200&h=675&itg=1&q=scorpian%20mortal&safe=strict&ved=2ahUKEwiOqtPwnb7wAhVSlJ4KHavGDpAQMygCegUIARDZAQ"
    },

}, {
    timestamps: true
});



module.exports = mongoose.model("User", userSchema)