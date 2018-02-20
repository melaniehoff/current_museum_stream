function init() {

  var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);



  var serverBaseUrl = document.domain;

  /*
   On client init, try to connect to the socket.IO server.
   Note we don't specify a port since we set up our server
   to run on port 8080
   */
  var socket = io.connect(serverBaseUrl);

  //We'll save our session ID in a variable for later
  var sessionId = '';
  var mySn;


  //Helper function to update the participants' list
  function updateParticipants(participants) {
    $('#participants').html('');
    for (var i = 0; i < participants.length; i++) {
      $('#participants').append('<span id="' + participants[i].id + '">' + (participants[i].id === sessionId ? '<span style="color:rgb(51, 18, 89); background-color:transparent; padding:0px; margin:0px;">⇢</span>' : '') +
        participants[i].name + '</span><br>');
    }
    var objDiv = document.getElementById("participants");
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  /*
   When the client successfully connects to the server, an
   event "connect" is emitted. Let's get the session ID and
   log it. Also, let the socket.IO server there's a new user
   with a session ID and a name. We'll emit the "newUser" event
   for that.
   */
  socket.on('connect', function() {
    $("#name").focus();
    sessionId = socket.io.engine.id;
    console.log('Connected ' + sessionId);
    getVimeoCredit();
  });



  /*
   When the server emits the "newConnection" event, we'll reset
   the participants section and display the connected clients.
   Note we are assigning the sessionId as the span ID.
   */

  socket.on('newConnection', function(data) {
    updateParticipants(data.participants);

  });
  /*
   When the server emits the "userDisconnected" event, we'll
   remove the span element from the participants element
   */
  socket.on('userDisconnected', function(data) {
    $('#' + data.id).remove();
  });


  /*

  /*
   When receiving a new chat message with the "incomingMessage" event,
   we'll prepend it to the messages section
   */
  socket.on('incomingMessage', function(data) {
    var message = data.message;
    var name = data.name;
    if (name == 'MelanieHoff'){
      name = '<span style="color:rgb(214, 0, 212);">' + name + '</span>'
    }
    if (name == mySn){
      name = '<span style="color:rgb(51, 18, 89);">' + name + '</span>'
    }
    $('#messages').append('<span class="chatName">' + name + ':</span>' + '<span class="chatText"> ' + message + '</span><br>');
    var objDiv = document.getElementById("messages");
    objDiv.scrollTop = objDiv.scrollHeight;
  });

  /*
   Log an error if unable to connect to server
   */
  socket.on('error', function(reason) {
    console.log('Unable to connect to server', reason);
  });

  /*
   "sendMessage" will do a simple ajax POST call to our server with
   whatever message we have in our textarea
   */

  function newName() {
    var sn = $('#name').val().split(' ').join('_');
    if (sn.length > 14) {
      alert("Pick a screenname under 15 characters plz");
    } else {
      socket.emit('newUser', {
        id: sessionId,
        name: sn
      });
      mySn = sn;
      $(".name").hide();
      $(".chatboxCon").show();
      $(".messagesCon").show();
      $(".chat").show();
      $("textarea").show();
      $("#stream").show();
      // $("#buddylist").show();

    }

  };

  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    var name = $('#name').val();
    if (name === ''){
      name = 'Anonymous';
    }
    $.ajax({
      url: '/message',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({
        message: outgoingMessage,
        name: name
      })
    });

  }

  /*
   If user presses Enter key on textarea, call sendMessage if there
   is something to share
   */
  // function outgoingMessageKeyDown(event) {
  //   if (event.which == 13) {
  //     event.preventDefault();
  //     if ($('#outgoingMessage').val().trim().length <= 0) {
  //       return;
  //     }
  //     sendMessage();
  //     $('#outgoingMessage').val('');
  //   }
  // }

  /*
   Helper function to disable/enable Send button
   */



  function changeBackground() {
    var video = $('#magicInput').val();
    console.log(video);
    socket.emit('newVideo', video);
  }

  function changeImage() {
    var image = $('#diamond').val();
    console.log(image);
    socket.emit('newImage', image);
  }


  socket.on('videoForAll', function(data) {
    console.log("we all got the video: " + data);
    var cleaned = data.replace(/https:\/\/vimeo.com/i, '');
    var newUrl = "https://player.vimeo.com/video" + cleaned + "?background=1autoplay=1&loop=1&title=0&byline=0&portrait=0";
    console.log(newUrl);
    $('.fullscreenImg').hide();
    $('#videoIframe').show();
    $('#videoIframe').attr('src', newUrl);
    $('.credit').show();
    getVimeoCredit();
  });

  socket.on('imageForAll', function(data) {
    console.log("we all got the IMAGE: " + data);
    $('#videoIframe').hide();
    $('.credit').hide();
    // $('#imageBg').attr('src', data);
    $('.fullscreenImg').css('background-image', 'url("' + data + '")');
    // $('.fullscreenImg').css('background-image','url("https://pbs.twimg.com/media/DWbBWw1VoAAjFKS.jpg")');
    // $('#imageBg').show();
    $('.fullscreenImg').show();
  });


  function getVimeoCredit() {
    console.log("getVimeoCredit Called");
    var vimeoUrl = $('#videoIframe').attr('src');
    // console.log("vimeoUrl = " + vimeoUrl);
    var subStr = vimeoUrl.match("video/(.*)\?background");
    // alert(subStr[1]);
    // console.log("subStr[1]: " + subStr[1]);
    vimeoId = subStr[1].slice(0, -1);
    console.log(vimeoId);

    $('.vimeo').each(function() {
      var $this = this;
      $.ajax({
        type: 'GET',
        url: 'http://vimeo.com/api/v2/video/' + vimeoId + '.json',
        jsonp: 'callback',
        dataType: 'jsonp',
        success: function(data) {

          var v = data[0];
          console.log(v.title);
          console.log(v.user_name);
          $("#title").html(v.title);
          $("#artist").html(v.user_name);

        }
      });
    });
  }

  setTimeout(function() {
    if (is_safari && (screen.width > 768)) {
      alert('Hi! It looks like you\'re using Safari and that\'s OK.\nTo get the full experience, switch to Chrome.');
    };
  }, 1400);


  $('#outgoingMessage').keypress(function(e) {
    if (e.which == 13) {
      sendMessage();
      $('textarea').val('');
      $('textarea').removeAttr('placeholder');
      return false; //<---- Add this line
    }
  });
  $('#name').keypress(function(e) {
    if (e.which == 13) {
      newName();
      return false; //<---- Add this line
    }
  });
  $('#magicInput').keypress(function(e) {
    if (e.which == 13) {
      changeBackground();
      return false; //<---- Add this line
    }
  });

  $('#diamond').keypress(function(e) {
    if (e.which == 13) {
      changeImage();
      return false; //<---- Add this line
    }
  });

  socket.on('password', function(data) {
    $('#myPsw').show();
    $('#stream').hide();
    $('textarea').hide();
  });


  $('#myPsw').keypress(function(e) {
    if (e.which == 13) {
      var x = document.getElementById("myPsw").value;
      socket.emit('gotPsw', {
        id: sessionId,
        password: x
      });
      return false; //<---- Add this line
    }
  });

  socket.on('itsMe', function(data) {
    console.log("ITSME!!!");
    setTimeout(function() {
      showshit();
    }, 1400);

  });


  socket.on('refresh', function(data) {
    alert("NO");
      location.reload();
  });


  function videoSize() {
    var $windowHeight = $(window).height();
    var $videoHeight = $(".video").outerHeight();
    var $scale = $windowHeight / $videoHeight;

    if ($videoHeight <= $windowHeight) {
      $(".video").css({
        "-webkit-transform": "scale(" + $scale + ") translateY(-50%)",
        "transform": "scale(" + $scale + ") translateY(-50%)"
      });
    };
  }

  $(window).on('load resize', function() {
    videoSize();
  });


}

function showshit(){
  $(".name").hide();
  $("#myPsw").hide();
  $("#stream").show();
  $("#magicInput").show();
  $("#diamond").show();
  $(".chatboxCon").show();
  $(".messagesCon").show();
  $('textarea').show();
  console.log("showshit!!!");
};

$(document).ready(function() {

  init();
});
