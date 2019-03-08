var buildMessage="< Click on the button bellow to generate code! />";
let timer;
let localApp;

var socket = io('http://localhost:8080');
socket.on('error', function(data) {
  console.error(data);
})
socket.on('js', function (data) {
  eval(data);
  console.log('Updating JS');
  if (document.getElementById('updater').className==='error'){
    if (localApp){
      socket.emit('css',localApp)
    }
  }
  document.getElementById('updater').className="updated";
  document.getElementById('updater').innerHTML="Updated at "+ getTime()+" ("+endTimer()+" seconds)";
  document.getElementById('embed-text').innerHTML = buildMessage;
});
socket.on('bundling-error', function (error) {
  console.error(error.error);
  document.getElementById('embedded-style').innerHTML = '';
  document.getElementById('embedded-component').innerHTML = unescape(encodeURIComponent(error.html));
  document.getElementById('updater').className="error"
  document.getElementById('updater').innerHTML="Error ("+ getTime()+") : "+error.data.name;

});
socket.on('css', function(data) {
  document.getElementById('embedded-style').innerHTML = data.trim();
  document.getElementById('updater').className="restyled";
  document.getElementById('updater').innerHTML="Restyled at "+getTime()+" ("+endTimer()+" seconds)";
  document.getElementById('embed-text').innerHTML = buildMessage;
})
socket.on('build', function (data) {
  document.getElementById('embed-text').innerHTML = data.trim();
  document.getElementById('updater').className="built"
  document.getElementById('updater').innerHTML="Built at "+ getTime()+" ("+endTimer()+" seconds)";
});
socket.on('updating', function(data) {
  startTimer();
  document.getElementById('updater').className="updating"
  document.getElementById('updater').innerHTML="Updating component..."
})
socket.on('restyling', function(data) {
  startTimer();
  document.getElementById('updater').className="restyling"
  document.getElementById('updater').innerHTML="Updating styles..."
})

/* functions - ui */
function select(e) {
  document.getElementById("embed-text").select()
}
function build(app){
  localApp=app;
  startTimer();
  document.getElementById('updater').className="building"
  document.getElementById('updater').innerHTML="Building HTML code..."
  socket.emit('build',app);
}
function onLoad(app) {
  localApp=app;
  startTimer();
  socket.emit('css',app);
  setTimeout(function () {
    startTimer();
    socket.emit('js',app);
    document.getElementById('updater').className="updating"
    document.getElementById('updater').innerHTML="Loading Component...";
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
