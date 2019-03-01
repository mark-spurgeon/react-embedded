var socket = io('http://localhost:8080');
socket.on('component', function (data) {
  eval(data);
  console.log('updated');
});
socket.on('build', function (data) {
  document.getElementById('embed-text').innerHTML = data;
});
socket.on('updating', function(data) {
  console.log('updating');
})

function select(e) {
  document.getElementById("embed-text").select()
}
function build(app){
  socket.emit('build',app)
}
