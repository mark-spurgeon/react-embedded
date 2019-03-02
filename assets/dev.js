var socket = io('http://localhost:8080');
socket.on('component', function (data) {
  eval(data);
  var when = new Date();
  document.getElementById('updater').className="updated";
  document.getElementById('updater').innerHTML="Updated at "+ when.getHours()+":"+when.getMinutes();

});
socket.on('build', function (data) {
  document.getElementById('embed-text').innerHTML = data;
  var when = new Date();
  document.getElementById('updater').className="built"
  document.getElementById('updater').innerHTML="Built at "+ when.getHours()+":"+when.getMinutes();
});
socket.on('updating', function(data) {
  document.getElementById('updater').className="updating"
  document.getElementById('updater').innerHTML="Updating component..."
})

function select(e) {
  document.getElementById("embed-text").select()
}
function build(app){
  document.getElementById('updater').className="building"
  document.getElementById('updater').innerHTML="Building HTML code..."
  socket.emit('build',app)
}
