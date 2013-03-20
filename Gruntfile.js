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
		cl2.sort();

		a = "var datalist = " + JSON.stringify(cl2) + ";\n";
		fs.writeFileSync("data/datalist.json", a);
	});

	grunt.registerTask('build', function() {
		var done = grunt.task.current.async();
		var exec = require('child_process').exec;
		exec("rm -rf build; mkdir build", function(e,i,o) {
		exec("cp -R .gitignore data frontend.js index.html scripts  style *64K *jpg build", function(e,i,o) {
		exec("grep --colour=none -m 1 -E '^v' README.md", function(e,i,o) {
		exec("sed -i 's/VVEERR/"+i.trim()+"/g' build/index.html", function(e,i,o) {
			done();
		});
		});
		});
		});
	});

	grunt.registerTask('release', function() {
		var done = grunt.task.current.async();
		var exec = require('child_process').exec;
		exec("git checkout gh-pages", function(e,i,o) {
			if (e1) done(false);
		exec("for act in $(find . -maxdepth 1 -not -name '*git*' -not -name build -not -name '.'); do rm -rf $act; done", function(e,i,o) {
		exec("cp -R build/.gitignore build/* .", function(e,i,o) {
		exec("git add -A; git commit -m 'release'", function(e,i,o) {
			done();
		});
		});
		});
		});
	});

  // Default task(s).
  grunt.registerTask('default', ['caslist']);

};
