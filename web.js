var connect = require('connect');
var port = process.env.PORT || 5000;
connect.createServer(
    connect.static(__dirname)
).listen(port);

