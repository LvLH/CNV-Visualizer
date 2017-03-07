module.exports = function (grunt) {

    // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        qunit: {
            hello: ['test/helloQUnit.html'],
            all: ['test/**/*.html']
        },

        connect: {
            uses_defaults: {}
        },

        concat: {
            igv: {
                src: [
                    'js/**/*.js',
                    '!js/module.js',
                    'vendor/inflate.js',
                    'vendor/zlib_and_gzip.min.js',
                    'vendor/jquery.mousewheel.js',
                    'vendor/promise-7.0.4.js',
                    'js/module.js',
                    'vendor/jquery.kinetic.min.js',
                    'vendor/underscore-min.js'
                ],
                dest: 'dist/igv.js'
            }
        },

        uglify: {
            options: {
                mangle: false,
                sourceMap: true
            },

            igv: {
                src: 'dist/igv.js',
                dest: 'dist/igv.min.js'
            }
        },

        copy: {
            css: {
                expand: true,
                src: 'css/igv.css',
                dest: 'dist'
            },
            img: {
                expand: true,
                cwd: 'css/img',
                src: '**',
                dest: 'dist/img/'
            },
            appcss: {
                expand: true,
                cwd: 'dist',
                src: 'css/igv.css',
                dest: 'app'
            },
            appjs: {
                expand: true,
                cwd: 'dist',
                src: '*.js',
                dest: 'app/js/'
            },
            biocircos: {
                expand: true,
                cwd: 'examples/cnvis/d3',
                src: 'biocircos-1.1.0.js',
                dest: 'app/js/'
            }
        },

        jsdoc : {
            dist : {
                src : ['js/*'],
                options: {
                    recurse: true,
                    destination: 'jsdoc'
                }
            }
        },

        electron : {
            linuxBuild : {
                options : {
                    name: "CNVisualizer",
                    dir: "app",
                    out: "electron-dist",
                    appVersion: "0.0.1",
                    electronVersion: "1.6.1",
                    all: true,
                    overwrite: true
                }
            }
        }
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-electron');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    //grunt.registerTask('default', ['concat:igvexp', 'uglify:igvexp']);
    //grunt.registerTask('default', ['concat:igv', 'uglify:igv', 'md2html:igv']);
    grunt.registerTask('default', ['concat:igv', 'uglify:igv', 'copy']);

    grunt.task.registerTask('unittest', 'Run one unit test.', function (testname) {

        if (!!testname)
            grunt.config('qunit.all', ['test/' + testname + '.html']);

        grunt.task.run('qunit:all');

    });

    grunt.registerTask('doc', ['md2html']);
};

