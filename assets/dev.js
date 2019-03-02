var buildMessage="< Click on the button bellow to generate code! />";

var socket = io('http://localhost:8080');
socket.on('component', function (data) {
  eval(data);
  document.getElementById('updater').className="updated";
  document.getElementById('updater').innerHTML="Updated at "+ getTime();
  document.getElementById('embed-text').innerHTML = buildMessage;
});
socket.on('css', function(data) {
  document.getElementById('embedded-style').innerHTML = data.trim();
  document.getElementById('updater').className="restyled"
  document.getElementById('updater').innerHTML="Restyled at "+getTime();
  document.getElementById('embed-text').innerHTML = buildMessage;
})
socket.on('build', function (data) {
  document.getElementById('embed-text').innerHTML = data.trim();
  document.getElementById('updater').className="built"
  document.getElementById('updater').innerHTML="Built at "+ getTime()
});
socket.on('updating', function(data) {
  document.getElementById('updater').className="updating"
  document.getElementById('updater').innerHTML="Updating component..."
})
socket.on('restyling', function(data) {
  document.getElementById('updater').className="restyling"
  document.getElementById('updater').innerHTML="Updating styles..."
})

/* functions - ui */
function select(e) {
  document.getElementById("embed-text").select()
}
function build(app){
  document.getElementById('updater').className="building"
  document.getElementById('updater').innerHTML="Building HTML code..."
  socket.emit('build',app)
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
