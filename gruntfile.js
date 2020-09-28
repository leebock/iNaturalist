'use strict';

module.exports = function (grunt) {
 
  // Configuration

  grunt.initConfig({
    jshint: {
      build: [
        '*.js'
      ],
      options: {jshintrc: '.jshintrc', ignores:[]}
    },
    watch: {
      scripts: {
        files: ['*.js'],
        tasks: ['jshint'],
        options: {
          livereload: true
        }        
      },
    },
    compress: {
      main: {
        options: {
          archive: "app.zip"
        },
        files: [
          {src: ["package.json", "main.js", "credentials.json", "token.json"]},
        ]
      }
    }        
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');  
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['jshint','watch']);
  grunt.registerTask("zip", ["compress"]);
  
};