/*
 Module dependencies:
 - Express
 - Http (to run Express)
 - Body parser (to parse JSON requests)
 - Underscore (because it's cool)
 - Socket.IO
 */
var express = require("express"),
  app = express(),
  http = require("http").createServer(app),
  bodyParser = require("body-parser"),
  io = require("socket.io").listen(http),
  _ = require("underscore"),
  cors = require('cors');

var sanitizeHtml = require('sanitize-html');

var recentMessages = [];
/*
 The list of participants in our chatroom.
 The format of each participant will be:
 {
 id: "sessionId",
 name: "participantName"
 }
 */
var participants = [];
var screenNames = [];
var currentVideo = "";
// var currentVideo = "https://player.vimeo.com/video/222431003?background=1autoplay=1&loop=1&title=0&byline=0&portrait=0";




/* Server config */

//Server's IP address
// app.set("ipaddr", "159.65.164.238");
// app.set("ipaddr", "192.168.1.22");
app.set("ipaddr", "0.0.0.0");


//Server's port number
app.set("port", 8080);

// ================== CORS
app.use(cors())

app.get('/products/:id', function(req, res, next) {
  res.json({
    msg: 'This is CORS-enabled for all origins!'
  })
})


// ========================

//Specify the views folder
app.set("views", __dirname + "/views");

//View engine is Jade
// app.set("view engine", "jade");
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

//Specify where the static content is
app.use(express.static("public", __dirname + "/public"));

//Tells server to support JSON requests
app.use(bodyParser.json());

/* Server routing */


//Handle route "GET /", as in "http://localhost:8080/"
app.get("/", function(request, response) {

  //Render the view called "index"
  response.render("index");

});





//POST method to create a chat message
app.post("/message", function(request, response) {

  //The request body expects a param named "message"
  var dirtyMessage = request.body.message;

  var message = sanitizeHtml(dirtyMessage, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    allowedAttributes: {
      'a': ['href']
    },
    allowedIframeHostnames: ['']
  });



  //If the message is empty or wasn't sent it's a bad request
  if (_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, {
      error: "Message is invalid"
    });
  }

  //We also expect the sender's name with the message
  var dirtyName = request.body.name;

  var name = sanitizeHtml(dirtyName, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    allowedAttributes: {
      'a': ['href']
    },
    allowedIframeHostnames: ['']
  });

  //TODO
  // recentMessages.push(message);

  //Let our chatroom know there was a new message
  io.sockets.emit("incomingMessage", {
    message: message,
    name: name
  });

  //Looks good, let the client know
  response.json(200, {
    message: "Message received"
  });

});

/* Socket.IO events */
io.on("connection", function(socket) {
  console.log("connection: " + socket.id);
  io.sockets.emit("newConnection", {
    participants: participants
  });

  /*
   When a new user connects to our server, we expect an event called "newUser"
   and then we'll emit an event called "newConnection" with a list of all
   participants to all connected clients
   */
  socket.on("newUser", function(data) {
    if (data.name == '') {
      data.name = 'Anonymous';
    }

    //console.log(screenNames);




    //The request body expects a param named "message"
    var dirtyName = data.name;

    var newName = sanitizeHtml(dirtyName, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedAttributes: {
        'a': ['href']
      },
      allowedIframeHostnames: ['']
    });

    var cleanName = newName.split(' ').join('_');
    if (cleanName == '') {
      cleanName = 'Anonymous';
    }
    var max_chars = 14;

    if (cleanName.length > max_chars) {
      cleanName = cleanName.substr(0, max_chars);
    }

    if (cleanName == 'MelanieHoff'){
      io.sockets.connected[data.id].emit('password');
    } else {
      screenNames.push(cleanName);
      console.log("new screenname: " + cleanName);

      participants.push({
        id: data.id,
        name: cleanName
      });
      io.sockets.emit("newConnection", {
        participants: participants
      });
    }

  });

  socket.on("gotPsw", function(data) {
    // console.log(data.id);
    // console.log(data.password);

    if (data.password == 'Para11el.'){
      screenNames.push('MelanieHoff');
      console.log("new screenname: " + 'MelanieHoff');

      participants.push({
        id: data.id,
        name: 'MelanieHoff'
      });
      io.sockets.emit("newConnection", {
        participants: participants
      });
      io.sockets.connected[data.id].emit('itsMe');
    } else {
      io.sockets.connected[data.id].emit('refresh');
    }
  });


  /*
   When a user changes his name, we are expecting an event called "nameChange"
   and then we'll emit an event called "nameChanged" to all participants with
   the id and new name of the user who emitted the original message
   */
  // socket.on("nameChange", function(data) {
  //   _.findWhere(participants, {id: socket.id}).name = data.name;
  //   io.sockets.emit("nameChanged", {id: data.id, name: data.name});
  // });

  /*
   When a client disconnects from the server, the event "disconnect" is automatically
   captured by the server. It will then emit an event called "userDisconnected" to
   all participants with the id of the client that disconnected
   */

  socket.on("newVideo", function(data) {
    // currentVideo = data;
    console.log("video: " + data);
    io.sockets.emit("videoForAll", data);
  });

  socket.on("newImage", function(data) {
    console.log("image: " + data);
    io.sockets.emit("imageForAll", data);
  });



  socket.on("disconnect", function() {
    participants = _.without(participants, _.findWhere(participants, {
      id: socket.id
    }));
    io.sockets.emit("userDisconnected", {
      id: socket.id,
      sender: "system"
    });
    console.log("disconnect: " + socket.id);
  });

});

//Start the http server at port and IP defined before
http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
  console.log('CORS-enabled web server listening on port 8080')
});
