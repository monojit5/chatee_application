import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
},
about: {
    type: String,
    trim: true,
    maxlength: 160,
    default: "Hey there! I am using ChatApp."
},
avatar: {
    type: String,
    default: ""
},
googleId: {
    type: String,
    unique: true,
    sparse: true
},
email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
},
password:{
    type: String,
    required: false,
    minlength: 6,
    select: false,
},
token:{
    type: String,   
    default: null,
    select: false
},
isVerified:{
    type: Boolean,
    default: false
},
isLoggedIn:{
    type: Boolean,
    default: false
}
},{timestamps: true});  
const User = mongoose.model('User', userSchema);
export default User;