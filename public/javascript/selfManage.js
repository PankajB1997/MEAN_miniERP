"use strict";

var mySelfManage = angular.module('mySelfManage', ['ngMaterial', 'angular-md5']);

mySelfManage.controller('ManageController', function($http, $window, $filter, $mdDialog, md5) {
    var self = this;


    //=== Variables ===


    //> enum
    self.pageEnum = {
        OVERVIEW_PAGE: 1,
        ACCOUNT_PAGE: 10,
        ACCOUNT_MAIN_PAGE: 11,
        END: 20
    };

    self.pageMask = self.pageEnum.OVERVIEW_PAGE;


    //=== HTTP request ===

    //> get emploee data
    $http.get('/api/employees', {params: {email: 'user'}}).then(function(res) {
        //> success
        self.myData = res.data;
    }, function(res) {
        //> fail
        console.error(res);
    });


    //=== Functions ===

    //> set page
    self.setPage = function(page)
    {
        /*
        switch(page)
        {
        }
        */

        //> set the page mask
        self.pageMask = page;
    }

    //> show selected page
    self.showPage = function(page) {
        switch(page)
        {
            case self.pageEnum.OVERVIEW_PAGE:
                return (self.pageMask >= self.pageEnum.OVERVIEW_PAGE && self.pageMask < self.pageEnum.ACCOUNT_PAGE);
            case self.pageEnum.ACCOUNT_PAGE:
                return (self.pageMask >= self.pageEnum.ACCOUNT_PAGE && self.pageMask < self.pageEnum.END);
            case self.pageEnum.ACCOUNT_MAIN_PAGE:
                return (self.pageMask == self.pageEnum.ACCOUNT_PAGE || self.pageMask == self.pageEnum.ACCOUNT_MAIN_PAGE);
        }
    }

    //> check pw changed
    self.checkPwChanged = function()
    {
        return self.oldPw && self.newPw && self.checkPw;
    }

    //> change pw
    self.changePw = function(ev)
    {
        var oldPwMd5 = md5.createHash(self.oldPw);    //> create md5 of password
        if(oldPwMd5 != self.myData.password)
        {
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('舊密碼輸入錯誤')
                            .ariaLabel('old pw wrong')
                            .ok('Got it');

            $mdDialog.show(myAlert);
        }
        else if(self.newPw != self.checkPw)
        {
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('新密碼不一致')
                            .ariaLabel('new pw not consistent')
                            .ok('Got it');

            $mdDialog.show(myAlert);
        }
        else
        {
            var newPwMd5 = md5.createHash(self.checkPw);    //> create md5 of password

            var confirm = $mdDialog.confirm()
                            .title('修改密碼')
                            .textContent('確定要修改密碼?')
                            .ariaLabel('pw changed')
                            .targetEvent(ev)
                            .ok('確認')
                            .cancel('取消');

            $mdDialog.show(confirm).then(function() {
                //> user confirm

                var empData = {
                    id: self.myData._id,
                    pw: newPwMd5
                };

                $http.post('/api/updateEmpPw', empData).then(function(res) {
                    //> success
                    var myAlert = $mdDialog.alert()
                                    .clickOutsideToClose(true)
                                    .title('Breaking News')
                                    .textContent('修改成功')
                                    .ariaLabel('pw changed succeeded')
                                    .ok('Got it');

                    $mdDialog.show(myAlert);
                    console.log('pw changed succeeded');  //> temp
                }, function(res) {
                    //> fail
                    var myAlert = $mdDialog.alert()
                                    .clickOutsideToClose(true)
                                    .title('Breaking News')
                                    .textContent('修改失敗')
                                    .ariaLabel('pw changed failed')
                                    .ok('Got it');

                    $mdDialog.show(myAlert);

                    console.log('pw changed failed'); //> temp
                });

                self.setPage(self.pageEnum.ACCOUNT_MAIN_PAGE);
            }, function() {
                //> user cancel
            });
        }
    }
});
