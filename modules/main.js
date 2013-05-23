requirejs.config({
    baseUrl: 'modules',
    paths: {
        lib: '../scripts',
        jquery: '../scripts/jquery-1.9.0',
        underscore: '../scripts/underscore',
        jasmine: '../scripts/jasmine/jasmine',
        'jasmine-html': '../scripts/jasmine/jasmine-html',
        meridium: '../scripts/meridium'
    },
    shim: {
        'underscore': {
            exports: '_'
        },
        'jquery': {
            exports: '$'
        },
        'jasmine-html': {
            deps: ['jasmine']
        }
    },
    urlArgs: '_ts=' + (new Date()).getTime()
});

define(['jquery', 'underscore', 'jasmine-html', 'acceptanceTests', 'unitTests'], function ($, _) {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;
   // debugger;
    var htmlReporter = new jasmine.HtmlReporter();
    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    $(function () {
        _.delay(function () {
            jasmineEnv.execute();
        }, 300);
    });
});