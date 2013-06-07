module.exports = function(grunt) {

	require('shelljs/global');

	grunt.loadNpmTasks("grunt-contrib-connect");

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
		connect: {
			server: {
				options: {
					port: 5000,
					base: require("path").resolve("."),
					keepalive: true
				}
			}
		}
  });

	grunt.registerTask('imglist', function() {
		var fs = require("fs");

		var gl = fs.readdirSync("games");
		var gl2 = [];
		for (i in gl) {
			if (/.*zip$/i.test(gl[i]))
				gl2.push(gl[i]);
		}
		gl2.sort();

		b = "var gamelist = " + JSON.stringify(gl2) + ";\n";
		fs.writeFileSync("games/list.json", b);
	});

	grunt.registerTask('build', function() {
		var done = grunt.task.current.async();
		var exec = require('child_process').exec;
		exec("rm -rf build; mkdir build", function(e,i,o) {
		exec("cp -R .gitignore games frontend.js index.html editor.html scripts 3rdparty style roms *jpg build", function(e,i,o) {
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
			if (e) done(false);
		exec("for act in $(find . -maxdepth 1 -not -name '*git*' -not -name node_modules -not -name build -not -name '.'); do rm -rf $act; done", function(e,i,o) {
		exec("cp -R build/.gitignore build/* .", function(e,i,o) {
		exec("git add -A; git commit -m 'release'; git push; git checkout master", function(e,i,o) {
			done();
		});
		});
		});
		});
	});

  // Default task(s).
  grunt.registerTask('default', ['imglist']);

};
