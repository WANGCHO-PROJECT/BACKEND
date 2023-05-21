const express = require('express');
const router = express.Router();

const postRoute = require('./posts')
const commentRoute = require('./comments')
const userRoute = require('./users')
const likeRoute = require('./likes')
module.exports = {postRoute,commentRoute,userRoute,likeRoute}