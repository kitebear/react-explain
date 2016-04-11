var express = require('express');
var router = express.Router()

router.get('/',function(req,res){
    res.render('index')
})

router.get('/react1/index',function(req,res){
    res.render('react1/index')
})

module.exports = router