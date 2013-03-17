module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
  });

	grunt.registerTask('caslist', function() {
		var fs = require("fs");
		var cl = fs.readdirSync("data");
		var cl2 = [];
		for (var i in cl) {
			if (cl[i].indexOf("cas") != -1)
				cl2.push(cl[i]);
		}

		a = "var datalist = " + JSON.stringify(cl2) + ";\n";
		fs.writeFileSync("data/datalist.json", a);
	});

  // Default task(s).
  grunt.registerTask('default', ['caslist']);

};
