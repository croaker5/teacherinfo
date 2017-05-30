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
                console.log("test:"+body)
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

    if(code) return;
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
                console.log("test:"+body);
                teacherID = body.UserId;
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
function obtainteacherinfo() {
    var options = {
        hostname: 'api.mysspku.com',
        path: '/index.php/V2/TeacherInfo/getDetail?teacherid=12154545&token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
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
            response.emit('finished');

        });

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
    async.series([
        obtainteacherID(req),
        obtainteacherinfo(),
        function () {

            if (body.data)
            {
                res.render('personalinfo', {
                        data: body.data
                    }
                )
            }

        }]);
    // obtainteacherID(req);
    // obtainteacherinfo();
    // res.render('personalinfo', {
    //         data: body.data
    //     }
    // )
    req.on('error', function (e) {
        console.log('ERROR: ' + e.message);
    });

});
app.get('/studentinfo',function(req,res){
    res.sendFile(__dirname+'/studentinfo.html');
});
app.get('/courseinfo',function(req,res){
    res.sendFile(__dirname+'/courseinfo.html');
});
app.get('/workloadinfo',function(req,res){
    res.sendFile(__dirname+'/workloadinfo.html');
});

// app.get('/register',function(req,res){
// 	if(req.session.user){
// 		return res.redirect('/');
// 	}
// 	res.render('register',{
// 		user:req.session.user,
// 		username:'',
// 		password:'',
// 		passwordRepeat:'',
// 		err:'',
// 		title:'注册'
// 	});
// });
// app.post('/register',function(req,res){
// 	var username=req.body.username,
// 		password=req.body.password,
// 		passwordRepeat=req.body.passwordRepeat;
// 	//检查输入的用户名密码是否合乎要求
// 	var err=strCheck.registerCheck(username,password,passwordRepeat);
// 	if(err!=''){
// 		console.log(err);
// 		return res.render('register',{
// 			user:req.session.user,
// 			username:username,
// 			password:password,
// 			passwordRepeat:passwordRepeat,
// 			err:err,
// 			title:'注册'
// 		});
// 	}
//
// 	//检查用户名是否已经存在，如果不存在则保存该条记录
// 	User.findOne({username:username},function(err,user){
// 		if(err){
// 			console.log(err);
// 			return res.render('register',{
// 				user:req.session.user,
// 				username:username,
// 				password:password,
// 				passwordRepeat:passwordRepeat,
// 				err:'内部错误，请重试！',
// 				title:'注册'
// 			});
// 		}
// 		if(user){
// 			console.log('用户名已存在！');
// 			return res.render('register',{
// 				user:req.session.user,
// 				username:username,
// 				password:password,
// 				passwordRepeat:passwordRepeat,
// 				err:'该用户名已被注册！',
// 				title:'注册'
// 			});
// 		}
// 		//对密码进行md5加密
// 		var md5=crypto.createHash('md5'),
// 			md5password=md5.update(password).digest('hex');
//
// 		//新建user对象用于保存数据
// 		var newUser=new User({
// 			username:username,
// 			password:md5password
// 		});
//
// 		newUser.save(function(err,doc){
// 			if(err){
// 				console.log(err);
// 				return res.render('register',{
// 					user:req.session.user,
// 					username:username,
// 					password:password,
// 					passwordRepeat:passwordRepeat,
// 					err:'内部错误，请重试！',
// 					title:'注册'
// 				});
// 			}
// 			console.log('用户'+username+'注册成功');
// 			return res.redirect('/login');
// 		});
// 	});
// });
//
// app.get('/login',function(req,res){
// 	if(req.session.user){
// 		return res.redirect('/');
// 	}
// 	res.render('login',{
// 		user:req.session.user,
// 		username:'',
// 		password:'',
// 		err:'',
// 		title:'登录'
// 	});
// });
// app.post('/login',function(req,res){
// 	var username=req.body.username,
// 		password=req.body.password,
// 		rememberMe=req.body.rememberMe;
// 	if(username.trim().length==0||password.trim().length==0){
// 		var err='用户名密码不能为空！';
// 		return res.render('login',{
// 			user:req.session.user,
// 			username:username,
// 			password:password,
// 			err:err,
// 			title:'登录'
// 		});
// 	}
// 	User.findOne({username:username},function(err,user){
// 		if(err){
// 			console.log(err)
// 			return res.redirect('/login');
// 		}
// 		if(!user){
// 			console.log('用户不存在！');
// 			return res.render('login',{
// 				user:req.session.user,
// 				username:username,
// 				password:password,
// 				err:'用户不存在！',
// 				title:'登录'
// 			});
// 		}
// 		var md5= crypto.createHash('md5'),
// 			md5password=md5.update(password).digest('hex');
// 		if(user.password!==md5password){
// 			console.log('密码错误！');
// 			return res.render('login',{
// 				user:req.session.user,
// 				username:username,
// 				password:password,
// 				err:'密码错误！',
// 				title:'登录'
// 			});
// 		}
// 		console.log('用户'+username+'登录系统！');
// 		user.password=null;
// 		delete user.password;
// 		req.session.user=user;
// 		//用户点击记住我，将session.cookie.maxAge设为1000*60*60*24*7
// 		if(rememberMe){
// 			req.session.cookie.maxAge=1000*60*60*24*7;
// 		}
// 		return res.redirect('/');
// 	});
// });
// app.get('/quit',function(req,res){
// 	req.session.user = null;
// 	console.log('退出');
// 	return res.redirect('/login');
//
// 	});
//
// app.get('/post',function(req,res){
// 	console.log('发布');
// 	res.render('post',{
// 		user:req.session.user,
// 		title: '发布'
// 	});
// });
// app.post('/post',function(req,res){
// 	var note = new Note({
// 		title: req.body.title,
// 		author:req.session.user.username,
// 		tag:req.body.tag,
// 		content:req.body.content
// 	});
// 	note.save(function(err,doc){
// 		if(err){
// 			console.log(err);
// 			return res.redirect('/post');
// 		}
// 		console.log('文章发表成功');
// 		return res.redirect('/');
// 	});
// });
// app.get('/detail/:_id',function(req,res){
// 	console.log('查看笔记！');
// 	Note.findOne({_id:req.params._id})
// 		.exec(function(err,art){
// 			if(err){
// 				console.log(err);
// 				return res.redirect('/');
// 			}
// 			if(art){
// 				res.render('detail',{
// 					title:'笔记详情',
// 					user:req.session.user,
// 					art: art,
// 					moment:moment
// 				});
// 			}
// 		});
//
// });


app.listen(3000,function(req,res){
	console.log('app is running at port 3000');
});