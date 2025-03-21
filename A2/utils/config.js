require("dotenv").config(); 

module.exports = {
    SECRET_KEY: process.env.SECRET_KEY || "default_fallback_key" 
};
