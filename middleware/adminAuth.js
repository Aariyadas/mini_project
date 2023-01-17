const session = require("express-session");

let isAdminLoggedin = false
let adminSession = null || {}

const isLogin = async(req,res,next)=>{
    try {
        adminSession = req.session
        if(adminSession.adminId){

            next()
        }
        else{
            res.redirect('/admin')
        }

    } catch (error) {
        console.log(error.message);
    }
}
const isLogout = async(req,res,next)=>{
    try {
        adminSession = req.session
        if(adminSession.adminId){
            isAdminLoggedin = true
            res.redirect('/admin/home')
        }
        next()

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}