const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
// const { verifyToken } = require('../../middleware/verifyToken');
// const { verifyToken } = require('../../middleware/verifyToken');

router
    .post("/signup", authController.Signup)
    .post("/login", authController.Login)
    // .patch("/updaterole/:id", verifyToken, authController.UpdateRole) // activity

module.exports = router;