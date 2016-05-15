"use strict";

var myLogin = angular.module('myAuth', ['angular-md5']);

myLogin.controller('AuthController', function($http, $window, md5) {
    var self = this;

    //=== variables ===

    self.email     = null;
    self.password  = null;
    self.haveError = false;

    //=== function ===

    //> check input data
    self.disableLogin = function() {
        if(self.email && self.password)
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    //> login
    self.login = function() {
        var passwordMd5 = md5.createHash(self.password);    //> create md5 of password

        var userData = {
            email: self.email,
            password: passwordMd5
        };

        $http.post('/api/login',userData).then(function(res) {
            //> success
            if('loginned' == res.data)
            {
                $window.location.href = '/';
            }
            else if('nouser' == res.data)   //> user input data have something wrong
            {
                self.haveError = true;
            }
        }, function(res) {
            //> fail
            console.error('login failed');
            console.error(res.data);
        });
    };
});
