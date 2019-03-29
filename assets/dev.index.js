var buildMessage="< Click on the button bellow to generate code! />";
let timer;
let localApp;

var socket = io('http://localhost:8080');
socket.on('error', function(data) {
  console.error(data);
})
socket.on('js', function (data) {
  eval(data);
  console.log('Updated JS');
  if (document.getElementById('updater').className==='error') {
    if (localApp){
      socket.emit('css',localApp);
    }
  }
  document.getElementById('embedded-component').style.display='block';
  document.getElementById('embedded-error').style.display='none';
  document.getElementById('updater').className="done update";
  document.getElementById('updater-text').innerHTML="Updated at "+ getTime()+" ("+endTimer()+" seconds)";
  document.getElementById('embed-text').innerHTML = buildMessage;
});
socket.on('bundling-error', function (error) {
  document.getElementById('embedded-style').innerHTML = '';
  document.getElementById('embedded-component').style.display='none';
  document.getElementById('embedded-error').style.display='block';
  document.getElementById('embedded-error').innerHTML = unescape(encodeURIComponent(error.html));
  document.getElementById('updater').className="done error";
  document.getElementById('updater-text').innerHTML="Error ("+ getTime()+") : "+error.data.name;

});
socket.on('css', function(data) {
  document.getElementById('embedded-style').innerHTML = data.trim();
  document.getElementById('updater').className="done style";
  document.getElementById('updater-text').innerHTML="Restyled at "+getTime()+" ("+endTimer()+" seconds)";
  document.getElementById('embed-text').innerHTML = buildMessage;
})
socket.on('build', function (data) {
  document.getElementById('embed-text').innerHTML = data.trim();
  document.getElementById('updater').className="done build"
  document.getElementById('updater-text').innerHTML="Built at "+ getTime()+" ("+endTimer()+" seconds)";
});
socket.on('updating', function(data) {
  console.log('Updating JS');
  startTimer();
  document.getElementById('updater').className="pending update"
  document.getElementById('updater-text').innerHTML="Updating component..."
})
socket.on('restyling', function(data) {
  startTimer();
  document.getElementById('updater').className="pending style"
  document.getElementById('updater-text').innerHTML="Updating styles..."
})

window.addEventListener("beforeunload", function(){
  socket.close()
});

/* functions - ui */
function select(e) {
  document.getElementById("embed-text").select()
}
function build(app){
  localApp=app;
  startTimer();
  document.getElementById('updater').className="pending build"
  document.getElementById('updater-text').innerHTML="Building HTML code..."
  socket.emit('build',app);
}
function onLoad(app) {
  localApp=app;
  startTimer();
  socket.emit('css',app);
  setTimeout(function () {
    startTimer();
    socket.emit('js',app);
    document.getElementById('updater').className="pending update"
    document.getElementById('updater-text').innerHTML="Loading Component...";
  }, 1000);
}
/* functions - any */
function getTime() {
  var when = new Date();
  var hours = when.getHours();
  var minutes = when.getMinutes();
  if (minutes<10) {
    minutes="0"+minutes.toString();
  }
  return hours+":"+minutes
}
function startTimer() {
  timer = new Date().getTime();
}
function endTimer() {
  newTimer = new Date().getTime();
  var seconds =  (newTimer-timer ) / 1000 ;
  timer = 0;
  return seconds
}
