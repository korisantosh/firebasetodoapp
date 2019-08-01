const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const engines = require('consolidate');
const handlebars = require('handlebars');
var bodyParser = require('body-parser');
var moment = require('moment');
const cors = require('cors') ({ origin:true});

handlebars.registerHelper("prettifyDate", (timestamp) => {
    return timestampHandler(timestamp);
});
handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a === b) { return options.fn(this); }
    return options.inverse(this);
});

handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a !== b) { return options.fn(this); }
    return options.inverse(this);
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

var urlEncodedParser = bodyParser.urlencoded({ extended : true});
var jsonParser = bodyParser.json();

var serviceAccount = require("./serviceAccountKey.json");
const firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://smartytaskapp-5763b.firebaseio.com"
});

const db = admin.firestore();
const firestoreSettings = {timestampsInSnapshots: true};
db.settings(firestoreSettings);

app.get('/', (request, response) => {
    // response.set('Cache-Control','public, max-age=300, s-maxage=600');
    var userRef = db.collection('task');
    var userDoc = userRef.get()
        .then( doc => {
            let tasks = mergeSubCollectionFields(doc);
            console.log(JSON.stringify(tasks));
            response.render('index',{ tasks });
            return true;
        })
        .catch(err => {
            //response.send("500");
            console.log("There is an error while fetching system user for "+err);
            next(err);
        });
});

const mergeSubCollectionFields = (subCollection) => {
	const json = {};

	subCollection.forEach((field) => {
		json[`${field.id}`] = field.data();
	});

	return json;
};
function timestampHandler(timestamp) {
      let fullTime = {};
      fullTime["timestamp"] = firedate = admin.firestore.Timestamp.fromDate(
        new Date(timestamp * 1000)
      );
      fullTime = moment(firedate.toDate()).format('MM/DD/YYYY h:m A');
      return fullTime;
  }

app.get('/:id', jsonParser, (request, response, next) => {
    var id = request.params.id;
    let status = request.query.update;
    console.log('req params' + id);
    console.log('req status' + status);
    var taskDetailRef = db.collection('task').doc(id);
    var taskDetail = taskDetailRef.get()
        .then( doc => {
            let taskData = doc.data();
            // console.log('taskData$$' + JSON.stringify(taskData));
            taskData.id = id;
            if(status&&status!=='') {
                taskData.status = status;
            }
            taskData.id = id;
            console.log('taskData.due ' + taskData.due);
            let time = timestampHandler(taskData.due);
            console.log('time===' + JSON.stringify(time));
            console.log('taskDataAFTER$$' + JSON.stringify(taskData));
            response.render('taskdetail',{ taskData });
            return true;
        })
        .catch(err => {
            //response.send("500");
            console.log("There is an error while fetching system user for "+err);
            next(err);
        });
});

/// API 
app.get('/task', jsonParser, (request, response, next) => {
    var userRef = db.collection('task');
    var userDoc = userRef.get()
        .then( doc => {
            response.json(mergeSubCollectionFields(doc));
            //response.send(doc.data());
            return true;
        })
        .catch(err => {
            //response.send("500");
            console.log("There is an error while fetching system user for "+err);
            next(err);
        });
    return false;
});
app.get('/task/:id', jsonParser, (request, response, next) => {
    var taskDetailRef = db.collection('task').doc(request.params.id);
    var taskDetail = taskDetailRef.get()
        .then( doc => {
            response.json(doc.data());
            //response.send(doc.data());
            return true;
        })
        .catch(err => {
            //response.send("500");
            console.log("There is an error while fetching system user for "+err);
            next(err);
        });
    return false;
});

app.post('/update', (req, res) => {
    console.log('INSIDE UPDATE $$$$' + req.body);
    let task_id = req.body.id;
    console.log('task_id' + task_id);
    var taskDetailRef = db.collection('task').doc(task_id);
    var taskDetail = taskDetailRef.set(req.body)
    .then(() => {
        console.log("success");
        res.redirect('/'+task_id+'?update=true');
        res.end();
        return true;
    })
    .catch((error) => {
        console.error("failed ", error);
        res.redirect('/'+task_id+'?update=false');
        // res.send("failed");
        res.end();
    });
    // res.send("success");
    // res.end();
    
});
exports.app = functions.https.onRequest(app);
