const express = require("express");
const router = new express.Router();

const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const ExpressError = require("../expressError")
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
 router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        let users = req.user.username;
        let { id } = req.params;
        let results = await Message.get(id);
        if (results.from_user.username == users || results.to_user.username == users) {
            return res.json({message: results});
        }
        else {
            throw new ExpressError(`Unauthorized`, 401);
        }
    }
    catch (err) {
        return next(err);
    }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
 router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        let from_username = req.user.username;
        let { to_username, body } = req.body;
        let results = await Message.create(from_username, to_username, body);
        return res.json({message: results});
    }
    catch (err) {
        return next(err);
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
 router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        let users = req.user.username;
        let { id } = req.params;
        let results = await Message.get(id);
        if (results.to_user.username == users) {
            let markMsg = await Message.markRead(id);
            return res.json(markMsg);
        }
        else {
            throw new ExpressError("Unauthorized.", 401);
        }
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;
