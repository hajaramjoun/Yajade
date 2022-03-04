/*****************************************************************************************************************************/
/*************************************************** Module dependencies *****************************************************/
/*****************************************************************************************************************************/

var express = require('express'),
	http = require('http'),
	path = require('path'),
	
	hash = require('./pass').hash,
    user = require('./routes/user'),
    mongoose = require('mongoose'),
    HashMap = require('hashmap').HashMap,
    Schema = mongoose.Schema, 
    nodemailer = require('nodemailer'),
    router = express.Router(),
	contentManagement = require('./routes/contentManagement');
	const request = require('request');
	const flash = require('connect-flash');

/*****************************************************************************************************************************/
/*************************************************** Variables ***************************************************************/
/*****************************************************************************************************************************/

//Variable pour les emails
//create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
 service: 'Gmail',
 auth: {
     user: 'hajar.amjoun@yajade.com',
     pass: 'Yajade09'
 }
});

//Variables concernant la base de données
var dataBaseName = 'mongodb://localhost/mydb';
var dataBaseCollectionUserName = 'users';
var dataBaseCollectionArticle = 'Article';
var dataBaseCollectionEmail = 'Email';

//Variable application
var app = express();
app.use(express.bodyParser())
.use(express.cookieParser('Authentication'))
.use(express.session())
.get('/users', user.list)
.set('port', process.env.PORT || 3002)
.set('views', __dirname + '/views')
.set('view engine', 'ejs')
.use(express.logger('dev'))
.use(express.favicon(path.join(__dirname, 'public','images','favicon.ico')))
.use(app.router)
.use(express.static(path.join(__dirname, 'public'))) 

//For authentication
.use(function (req, res, next) {
    var err = req.session.error,
        msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
});


/*****************************************************************************************************************************/
/*************************************** Création des schémas et modèles *****************************************************/
/*****************************************************************************************************************************/
/*Modèle de la table des users*/
var UserSchema = new Schema({
    username: String,
    password: String,
    salt: String,
    hash: String
});
var User = mongoose.model(dataBaseCollectionUserName, UserSchema);

/* Modèle de la table des Articles */
var ArticlesSchema = new Schema({
	title: String, 
	description: String,
	content: String,
	reference: String,
	mDate: Date, 
    pDate: Date,
});
var ArticleModel = mongoose.model(dataBaseCollectionArticle, ArticlesSchema);

/* Modèle de la table des Emails */
var EmailSchema = new Schema({
	name: String, 
	email: String,
	message: String,
	pDate: Date,
});
var EmailModel = mongoose.model(dataBaseCollectionEmail, EmailSchema);


/*****************************************************************************************************************************/
/*************************************** Fonctions d'aide à l'authentification ***********************************************/
/*****************************************************************************************************************************/
function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);
    User.findOne({
        username: name
    },
    function (err, user) {
        if (user) {
            if (err) return fn(new Error('cannot find user'));
            hash(pass, user.salt, function (err, hash) {
                if (err) return fn(err);
                if (hash == user.hash) return fn(null, user);
                fn(new Error('invalid password'));
            });
        } else {
            return fn(new Error('cannot find user'));
        }
        mongoose.connection.close();
    });
}

function requiredAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

function userExist(req, res, next) {
	mongoose.connect(dataBaseName, function(err) {
		if (err) { throw err; }
	});
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
           next();
        } else {
        	req.session.error = "User Exist"
        	res.redirect("/signup");
        }
        mongoose.connection.close();
    });
}

/*****************************************************************************************************************************/
/************************************************* Gestion des utilisateurs **************************************************/
/*****************************************************************************************************************************/

app.get("/manageUsers", function (req, res) {
    if (req.session.user) {
		mongoose.connect(dataBaseName, function(err) {
			  if (err) { throw err; }
		});
		User.find(function (err, userList) {
		if (err) { 
			throw err; 
		}else{
			 res.render('manageUsers.ejs', {message:req.session.error, userList: userList});
		}	
		mongoose.connection.close();
		});
    } else {
    	res.redirect("/");
    }
})

.post("/manageUsers", userExist, function (req, res) {
    var password = req.body.password;
    var username = req.body.username;
    hash(password, function (err, salt, hash) {
    	mongoose.connect(dataBaseName, function(err) {
    		if (err) { throw err; }
    	});
        if (err) throw err;
        var user = new User({
            username: username,
            salt: salt,
            hash: hash,
        }).save(function (err, newUser) {
            if (err) { 
            	throw err;
            }else {
            	mongoose.connection.close();
            	res.redirect("/manageUsers");
            }
        });
    });
})

/* On Supprime un membre de la base de données */
.get('/manageUsers/delete/:id', function(req, res) {
    if (req.params.id != '') {
	    mongoose.connect(dataBaseName, function(err) {
			  if (err) { throw err; }
	  	});
	  	User.remove({ _id : req.params.id }, function (err) {
	    	  if (err) { throw err; }
	    	  console.log(req.params.id+' deleted !');
	    	  mongoose.connection.close();
	    	});
    }
    
    res.redirect('/manageUsers');
})

/*****************************************************************************************************************************/
/*********************************************** Connection / deconnection ***************************************************/
/*****************************************************************************************************************************/
.post("/login", function (req, res) {
	mongoose.connect(dataBaseName, function(err) {
		if (err) { throw err; }
	});
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            req.session.regenerate(function () {
                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                res.redirect('/');
            });
        } else {
        	mongoose.connection.close();
            req.session.error = 'Authentication failed, please check your ' + ' username and password.';
            res.redirect('/');
        }
    });
})

.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect('/');
    });
})

/*****************************************************************************************************************************/
/************************************************** Gestion des articles *****************************************************/
/*****************************************************************************************************************************/

/*On affiche le formulaire d'article préremplie à modifier */
.get('/contentManagement/:ref', function(req, res) { 
	if(req.params.ref != null && req.session.user) {
		mongoose.connect(dataBaseName, function(err) {
			  if (err) { throw err; }
		});
		var query = ArticleModel.find(null);
		query.where('reference', req.params.ref);
		query.exec(function (err, anArticle) {
		if (err) { 
			throw err; 
		}else{
			 res.render('contentManagement.ejs', {article:((anArticle!=null && anArticle!="")?anArticle:null), reference:((anArticle!=null && anArticle!="")?anArticle.reference:req.params.ref)});
		}	
		mongoose.connection.close();
		});
	} else {
    	res.redirect("/");
	}
})

/* On ajoute ou modifie un article de la base de données */
.post('/contentManagment/update/', function(req, res) {
	if (req.body.reference != '' && req.body.reference != null) {
		mongoose.connect(dataBaseName, function(err) {
			if (err) { throw err; }
		});
		var query = ArticleModel.find(null);
		query.where('reference',req.body.reference);
		query.exec(function (err, anArticle) {
		if (err) { throw err; }
		//Update
		if(anArticle != null && anArticle != ""){
			ArticleModel.update({ reference : req.body.reference}, { title : req.body.title, description :req.body.description, content: req.body.content }, function (err) {
	    		  if (err) { throw err; }
	    		  console.log('The article has been updated > '+req.body.title);
	    		  mongoose.connection.close();
	    		  res.redirect('/');
	    	});
		} else {
		//Create
			var article = new ArticleModel();
			article.title = req.body.title;
			article.content = req.body.content;
			article.description = req.body.description;
			article.reference = req.body.reference;
			article.save(function(err, result) {
				if (err) {
					console.log(err);
				}
				mongoose.connection.close();
			});
			res.redirect('/');
		}
	});
	};
})

/*****************************************************************************************************************************/
/********************************** Affichage de la page d'acceuil avec les articles *****************************************/
/*****************************************************************************************************************************/

.get('/', function(req, res) { 
	mongoose.connect(dataBaseName, function(err) {
		  if (err) { throw err; }
	});
	ArticleModel.find(function (err, articleList) {
	if (err) { 
		throw err; 
	}else{
		var mapReferenceArticle = new HashMap();
        var article;
  		for (var i = 0, l = articleList.length; i < l; i++) {
    	article = articleList[i];
    	mapReferenceArticle.set(article.reference, article);
   	}
  	res.render('index.ejs', {mapReferenceArticle: mapReferenceArticle, loggedMember:req.session.user});
	}	
	mongoose.connection.close();
	});
})



/************************************************************************************/
/********************************* Gestion des mails ********************************/
/************************************************************************************/
/* On affiche l'historique des emails*/
.get('/historicMails', function(req, res) { 
	if (req.session.user) {
		mongoose.connect(dataBaseName, function(err) {
			  if (err) { throw err; }
		});
		EmailModel.find(function (err, mailsList) {
		if (err) { 
			throw err; 
		}else{
			 res.render('historicMails.ejs', {mailsList: mailsList});
		}	
		mongoose.connection.close();
		});
	 } else {
	    	res.redirect("/");
	 }
})
/* On Supprime un membre de la base de données */
.get('/historicMails/delete/:id', function(req, res) {
    if (req.params.id != '') {
	    mongoose.connect(dataBaseName, function(err) {
			  if (err) { throw err; }
	  	});
		EmailModel.remove({ _id : req.params.id }, function (err) {
	    	  if (err) { throw err; }
	    	  console.log(req.params.id+' deleted !');
	    	  mongoose.connection.close();
	    	});
    }
    res.redirect('/historicMails');
})


/* Traitement des informations du formulaire de contact */
/* On modifie un membre de la base de données */
.post('/contactForm', function(req, res) {
	// if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null)
	// {
	//   return res.json({"responseError" : "Please select captcha first"});
	// }
	const secretKey = '6LdpvDEUAAAAAHszsgB_nnal29BIKDsxwAqEbZzU';
  
	const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
  
	request(verificationURL,function(error,response,body) {
	  body = JSON.parse(body);
  
	  if(body.success !== undefined && !body.success) {
		document.getElementById("order").disabled = false;
		//app.use(flash('info', 'Flash is back!'));
		res.redirect('/')
		//req.flash('danger','Please select captcha first')
	  }




    if ((req.body.name != '') && (req.body.email != '') && (req.body.message != '')) {
    	mongoose.connect(dataBaseName, function(err) {
  		  if (err) { throw err; }
    	});
		
    	//Sauvegarde en base de donnée des différents mails
		var email = new EmailModel();
		email.name = req.body.name;
		email.email = req.body.email;
		email.message = req.body.message;
		email.pDate = new Date();
		email.save(function(err, result) {
			if (err) {
				console.log(err);
			}
			mongoose.connection.close();
		});
		
		//Création de l'email et envoi
		var mailOptions = {
			    from: req.body.email, // sender address
			    to: 'nicolas.boucher@yajade.com', // list of receivers
			    subject: 'Contact from Yajade.com', // Subject line
			    text: req.body.message, // plaintext body
			};
		
		transporter.sendMail(mailOptions, function(error, info){
		    if(error){
		        console.log(error);
		    } else {
		    	console.log('Message sent: ' +info.response);
		    }
		});
    }
	res.redirect('/');
});
});


/************************************************************************************/
/******************************* Création du serveur ********************************/
/************************************************************************************/

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
