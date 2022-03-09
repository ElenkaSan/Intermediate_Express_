
 const express = require("express");
 const router = new express.Router();
 const bcrypt = require("bcrypt");
 const jwt = require("jsonwebtoken");
 
 const ExpressError = require("../expressError");
 const User = require("../models/user");
 const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
 router.post('/login', async function (req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        throw new ExpressError("Username and password required", 400);
      }
      let result = await User.authenticate(username, password);
      if (result) {
          User.updateLoginTimestamp(username);
          const token = jwt.sign({ username }, SECRET_KEY);
          return res.json({ message: `You logged in!`, token })
      }
      else {
          throw new ExpressError("Invalid username/password", 400);
      }
    } catch (err) {
      return next(err);
    }
  });

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
 router.post('/register', async function (req, res, next) {
   try {
     const { username, password, first_name, last_name, phone } = await User.register(req.body);
    //  req.body;
     if (!username || !password) {
        throw new ExpressError("Username and password required", 400);
     }
    //  let result = await User.register({ username, password, first_name, last_name, phone });
     User.updateLoginTimestamp(username);
     const token = jwt.sign({ username }, SECRET_KEY);
     return res.json({ message: `You signed up!`, token });
   } 
   catch (err) {
    if (err.code === '23505') {
        return next(new ExpressError("Username taken. Please take another one!", 400));
    }
     return next(err);
   }
 });
 
 module.exports = router;
 