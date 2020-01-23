const express = require('express');
const router = express.Router();

router.get('/' , (req,res) => {
    res.render('index.ejs');
});

router.get('/streaming' , (req,res) => {
    res.render('streaming.ejs');
});

router.get('/list' , (req,res) => {
    res.render('listposts.ejs');
});

module.exports = router;