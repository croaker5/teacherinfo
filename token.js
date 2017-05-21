var express = require('express');
var path = require ('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session');
var moment = require('moment');

// var mongoose = require('mongoose');

var models = require('./models/models');
var checkLogin = require('./checkLogin.js');
var strCheck=require('./strCheck.js');


// mongoose.connect('mongodb://localhost:27017/notes');
// mongoose.connection.on('error',console.error.bind(console,'连接数据库失败'));



var app = express();

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(express.static(path.join(__dirname,'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}),function(req,res){
    var body = bodyParser(req);
    console.log(body);

});

app.use(session({
    secret: '1234',
    name: 'mynote' ,
    cookie: {maxAge: 1000*60*20},
    resave: false,
    saveUninitialized:true
}));

var User = models.User;
var Note = models.Note;

app.get('/',checkLogin.noLogin);
app.get('/',function(req,res){
    Note.find({author: req.session.user.username})
        .exec(function(err,allNotes){
            if(err){
                console.log(err);
                return res.redirect('/');
            }
            res.render('index',{
                title: '首页',
                user:req.session.user,
                notes:allNotes
            });
        });

});
app.get('/register',function(req,res){
    if(req.session.user){
        return res.redirect('/');
    }
    res.render('register',{
        user:req.session.user,
        username:'',
        password:'',
        passwordRepeat:'',
        err:'',
        title:'注册'
    });
});
app.post('/register',function(req,res){
    var username=req.body.username,
        password=req.body.password,
        passwordRepeat=req.body.passwordRepeat;
    //检查输入的用户名密码是否合乎要求
    var err=strCheck.registerCheck(username,password,passwordRepeat);
    if(err!=''){
        console.log(err);
        return res.render('register',{
            user:req.session.user,
            username:username,
            password:password,
            passwordRepeat:passwordRepeat,
            err:err,
            title:'注册'
        });
    }

    //检查用户名是否已经存在，如果不存在则保存该条记录
    User.findOne({username:username},function(err,user){
        if(err){
            console.log(err);
            return res.render('register',{
                user:req.session.user,
                username:username,
                password:password,
                passwordRepeat:passwordRepeat,
                err:'内部错误，请重试！',
                title:'注册'
            });
        }
        if(user){
            console.log('用户名已存在！');
            return res.render('register',{
                user:req.session.user,
                username:username,
                password:password,
                passwordRepeat:passwordRepeat,
                err:'该用户名已被注册！',
                title:'注册'
            });
        }
        //对密码进行md5加密
        var md5=crypto.createHash('md5'),
            md5password=md5.update(password).digest('hex');

        //新建user对象用于保存数据
        var newUser=new User({
            username:username,
            password:md5password
        });

        newUser.save(function(err,doc){
            if(err){
                console.log(err);
                return res.render('register',{
                    user:req.session.user,
                    username:username,
                    password:password,
                    passwordRepeat:passwordRepeat,
                    err:'内部错误，请重试！',
                    title:'注册'
                });
            }
            console.log('用户'+username+'注册成功');
            return res.redirect('/login');
        });
    });
});

app.get('/login',function(req,res){
    if(req.session.user){
        return res.redirect('/');
    }
    res.render('login',{
        user:req.session.user,
        username:'',
        password:'',
        err:'',
        title:'登录'
    });
});
app.post('/login',function(req,res){
    var username=req.body.username,
        password=req.body.password,
        rememberMe=req.body.rememberMe;
    if(username.trim().length==0||password.trim().length==0){
        var err='用户名密码不能为空！';
        return res.render('login',{
            user:req.session.user,
            username:username,
            password:password,
            err:err,
            title:'登录'
        });
    }
    User.findOne({username:username},function(err,user){
        if(err){
            console.log(err)
            return res.redirect('/login');
        }
        if(!user){
            console.log('用户不存在！');
            return res.render('login',{
                user:req.session.user,
                username:username,
                password:password,
                err:'用户不存在！',
                title:'登录'
            });
        }
        var md5= crypto.createHash('md5'),
            md5password=md5.update(password).digest('hex');
        if(user.password!==md5password){
            console.log('密码错误！');
            return res.render('login',{
                user:req.session.user,
                username:username,
                password:password,
                err:'密码错误！',
                title:'登录'
            });
        }
        console.log('用户'+username+'登录系统！');
        user.password=null;
        delete user.password;
        req.session.user=user;
        //用户点击记住我，将session.cookie.maxAge设为1000*60*60*24*7
        if(rememberMe){
            req.session.cookie.maxAge=1000*60*60*24*7;
        }
        return res.redirect('/');
    });
});
app.get('/quit',function(req,res){
    req.session.user = null;
    console.log('退出');
    return res.redirect('/login');

});

app.get('/post',function(req,res){
    console.log('发布');
    res.render('post',{
        user:req.session.user,
        title: '发布'
    });
});
app.post('/post',function(req,res){
    var note = new Note({
        title: req.body.title,
        author:req.session.user.username,
        tag:req.body.tag,
        content:req.body.content
    });
    note.save(function(err,doc){
        if(err){
            console.log(err);
            return res.redirect('/post');
        }
        console.log('文章发表成功');
        return res.redirect('/');
    });
});
app.get('/detail/:_id',function(req,res){
    console.log('查看笔记！');
    Note.findOne({_id:req.params._id})
        .exec(function(err,art){
            if(err){
                console.log(err);
                return res.redirect('/');
            }
            if(art){
                res.render('detail',{
                    title:'笔记详情',
                    user:req.session.user,
                    art: art,
                    moment:moment
                });
            }
        });

});


app.listen(3000,function(req,res){
    console.log('app is running at port 3000');
});