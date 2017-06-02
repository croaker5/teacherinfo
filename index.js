var express = require('express');
var path = require ('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var qs = require('qs');
var later = require('later');
var https = require('https');
var async = require('async');

var corpid = "wx1d3765eb45497a18";
var corpsecret = "vy8wF3w6a83ET-5Qp7e0zmAlvGVRsmhQPFVlOGLw0bPH7khRLdgeBCAgsahYp-EP";
var access_token;

var code;
var teacherID;
var body;
var IDflag = false;
var bodyflag = true;

var app = express();

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(express.static(__dirname));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));//设置中间件仅仅解析使用urlencoded编码的请求，extended设置为true的含义是
                                               //使用qs库而不是querystring库解析数据，并且解析出的键值对的值可以是任意类型

// var sched = later.parse.recur().every(1).hour();
// next = later.schedule(sched).next(10);
// console.log(next);

// var timer = later.setInterval(test, sched);
setTimeout(test, 2000);

function test() {
    console.log(new Date());
    var options = {
        hostname: 'qyapi.weixin.qq.com',
        path: '/cgi-bin/gettoken?corpid=' + corpid + '&corpsecret=' + corpsecret
    };
    var req = https.get(options, function (res) {
        //console.log("statusCode: ", res.statusCode);
        //console.log("headers: ", res.headers);
        var bodyChunks = '';
        res.on('data', function (chunk) {//在发生data事件时进行字符串的拼接
            bodyChunks += chunk;
        });
        res.on('end', function () {   //在发生end事件时对chunk进行解析
            var body = JSON.parse(bodyChunks);
            //console.dir(body);
            if (body.access_token) {
                access_token = body.access_token;
                //saveAccessToken(access_token);
                console.log("the token is &"+access_token+"&");
            } else {
                console.dir(body);
            }
        });
    });
    req.on('error', function (e) {
        console.log('ERROR: ' + e.message);
    });
}

function obtainteacherID(req){

    var query = require('url').parse(req.url).query;
    var params = qs.parse(query);
    console.log("The code is "+ params.code);
    code = params.code;


    console.log("current token: "+access_token);
    console.log("current code : "+code);

    var link ="https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token="+access_token+"&code="+code;
    var request = https.get(link, function (res) {
        var bodyChunks = '';
        res.on('data', function (chunk) {//在发生data事件时进行字符串的拼接
            bodyChunks += chunk;
        });
        res.on('end', function () {   //在发生end事件时对chunk进行解析
            var body = JSON.parse(bodyChunks);
            if (body.UserId) {
                //saveAccessToken(access_token);
                console.log("body:"+body);
                teacherID = body.UserId;
                IDflag = true;
                console.log("the id is "+body.UserId);
            } else {
                console.dir(body);
            }
        });
    });
    request.on('error', function (e) {
        console.log('ERROR: ' + e.message);
    });

}
// app.use(function (req,res,next) {
//
// 	obtainteacherID(req);
// 	next();
//
// })
// app.use(function (req,res,next) {
//
//     obtainteacherinfo();
// 	next();
//
// })

app.get('/personalinfo',function(req,res){
    if(IDflag == false)
        obtainteacherID(req);
    var options = {
        hostname: 'api.mysspku.com',
        path: '/index.php/V2/TeacherInfo/getDetail?teacherid='+teacherID+'&token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        rejectUnauthorized:false
    };
    var request = https.get(options, function (response) {
        var bodyChunks = '';
        response.on('data', function (chunk) {//在发生data事件时进行字符串的拼接
            bodyChunks += chunk;
        });
        response.on('end', function () {   //在发生end事件时对chunk进行解析
            body = JSON.parse(bodyChunks);
            console.dir(body);
            res.render('personalinfo',{
                data: body.data
            })

        });

    });



    req.on('error', function (e) {
        console.log('ERROR: ' + e.message);
    });

});
app.get('/studentinfo',function(req,res){
    if(IDflag == false)
        obtainteacherID(req);
    var options = {
        hostname: 'api.mysspku.com',
        path: '/index.php/V2/TeacherInfo/getDetail?teacherid='+teacherID+'&token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        rejectUnauthorized:false
    };
    var request = https.get(options, function (response) {
        var bodyChunks = '';
        response.on('data', function (chunk) {//在发生data事件时进行字符串的拼接
            bodyChunks += chunk;
        });
        response.on('end', function () {   //在发生end事件时对chunk进行解析
            body = JSON.parse(bodyChunks);
            console.dir(body);
            res.render('studentinfo',{
                data: body.data
            })

        });

    });



    req.on('error', function (e) {
        console.log('ERROR: ' + e.message);
    });
});
app.get('/courseinfo',function(req,res){
    res.sendFile(__dirname+'/courseinfo.html');
});
app.get('/workloadinfo',function(req,res){
    res.sendFile(__dirname+'/workloadinfo.html');
});



app.listen(3000,function(req,res){
	console.log('app is running at port 3000');
});