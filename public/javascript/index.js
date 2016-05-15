"use strict";

var myEpaper = angular.module('myEpaper', ['ngMaterial']);

myEpaper.controller('EpaperController', function($http, $window, $mdDialog) {
    var self = this;

    //=== Variables ===

    self.myAllEpapers     = [];
    self.myWaitingEpapers = [];

    //> enum
    self.pageEnum = {
        MAIN_PAGE: 1,
        ALL_PAGE: 2,
        ALL_EPAPER: 3,
        APPROVED_PAGE: 4,
        APPROVED_EPAPER: 5,
        WAITING_PAGE: 6,
        WAITING_EPAPER: 7,
        APPROVING_PAGE: 8,
        APPROVING_EPAPER: 9
    };

    self.pageMask = self.pageEnum.MAIN_PAGE;

    //=== HTTP request ===

    //> get all my waiting epapers
    function getWaitingEpapers()
    {
        self.myWaitingEpapers.splice(0,self.myWaitingEpapers.length);
        for(var i = 0; i < self.myAllEpapers.length; i++)
        {
            if(self.myAllEpapers[i].status == 'approving')
            {
                self.myWaitingEpapers.push(angular.copy(self.myAllEpapers[i]));
            }
        }
    };

    //> get all my epapers when loading
    $http.get('/api/epaper').then(function(res) {
            //> success
            self.myAllEpapers = res.data;
            getWaitingEpapers();
        }, function(res) {
            //> fail
            console.error(res);
    });

    //> get leave info when loading
    $http.get('/api/leaveData').then(function(res) {
        //> success
        self.leaveData = res.data;
    }, function(res) {
        //> fail
        console.error(res);
    });

    function getApprovedEpapers()
    {
        $http.get('/api/epaper/approved').then(function(res) {
                //> success
                self.myApprovedEpapers = res.data;
            }, function(res) {
                //> fail
                console.error(res);
        });
    }

    getApprovedEpapers();

    //> get all epapers need my approval
    function getApprovingEpapers()
    {
        $http.get('/api/epaper/approving').then(function(res) {
                //> success
                self.myApprovingEpapers = res.data;
            }, function(res) {
                //> fail
                console.error(res);
        });
    };

    getApprovingEpapers();

    //=== Functions ===

    //> set page
    self.setPage = function(page) {
        switch(page)
        {
            case self.pageEnum.ALL_PAGE:
            case self.pageEnum.APPROVED_PAGE:
            case self.pageEnum.WAITING_PAGE:
            case self.pageEnum.APPROVING_PAGE:
                self.currentEpaper = null;
        }

        //> set the page mask
        self.pageMask = page;
    };

    //> show page
    self.showPage = function(page) {
        switch(page)
        {
            case self.pageEnum.MAIN_PAGE:
                return (self.pageMask == self.pageEnum.MAIN_PAGE);
            case self.pageEnum.ALL_PAGE:
                return (self.pageMask == self.pageEnum.ALL_PAGE);
            case self.pageEnum.ALL_EPAPER:
                return (self.pageMask == self.pageEnum.ALL_EPAPER);
            case self.pageEnum.APPROVED_PAGE:
                return (self.pageMask == self.pageEnum.APPROVED_PAGE);
            case self.pageEnum.APPROVED_EPAPER:
                return (self.pageMask == self.pageEnum.APPROVED_EPAPER);
            case self.pageEnum.WAITING_PAGE:
                return (self.pageMask == self.pageEnum.WAITING_PAGE);
            case self.pageEnum.WAITING_EPAPER:
                return (self.pageMask == self.pageEnum.WAITING_EPAPER);
            case self.pageEnum.APPROVING_PAGE:
                return (self.pageMask == self.pageEnum.APPROVING_PAGE);
            case self.pageEnum.APPROVING_EPAPER:
                return (self.pageMask == self.pageEnum.APPROVING_EPAPER);
        }
    };

    //> show all epapers which need my approval
    self.checkAll = function(index) {
        self.currentEpaper = self.myAllEpapers[index];

        //> set the page mask
        self.pageMask = self.pageEnum.ALL_EPAPER;
    };

    //> show all epapers which need my approval
    self.checkApproved = function(index) {
        self.currentEpaper = self.myApprovedEpapers[index];

        //> set the page mask
        self.pageMask = self.pageEnum.APPROVED_EPAPER;
    };

    //> show all epapers which need my approval
    self.checkWaiting = function(index) {
        self.currentEpaper = self.myWaitingEpapers[index];

        //> set the page mask
        self.pageMask = self.pageEnum.WAITING_EPAPER;
    };

    //> show all epapers which need my approval
    self.checkApproving = function(index) {
        self.currentEpaper = self.myApprovingEpapers[index];

        //> set the page mask
        self.pageMask = self.pageEnum.APPROVING_EPAPER;
    };

    //> approve epaper
    self.approveEpapreSubmit = function() {
        var epapreData = {
            id : self.currentEpaper._id
        };

        $http.post('/api/approveEpaper', epapreData).then(function(res) {
            //> success
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('核准成功')
                            .ariaLabel('approveEpaper succeeded')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            self.myAllEpapers = res.data;

            //> get all epapers need my approval
            getApprovingEpapers();

            //> get all my waiting epapers
            getWaitingEpapers();

            //> get all my approved epapers
            getApprovedEpapers();

            console.log('approveEpaper succeeded');  //> temp
        }, function(res) {
            //> fail
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('核准失敗')
                            .ariaLabel('approveEpaper failed')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            console.log('approveEpaper failed'); //> temp
        });

        self.setPage(self.pageEnum.MAIN_PAGE);
    };

    //> reject application
    //> approve epaper
    self.rejectEpapre = function() {
        var epapreData = {
            id : self.currentEpaper._id
        };

        $http.post('/api/rejectEpaper', epapreData).then(function(res) {
            //> success
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('駁回成功')
                            .ariaLabel('rejectEpaper succeeded')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            self.myAllEpapers = res.data;

            //> get all epapers need my approval
            getApprovingEpapers();

            //> get all my waiting epapers
            getWaitingEpapers();

            //> get all my approved epapers
            getApprovedEpapers();

            console.log('rejectEpaper succeeded');  //> temp
        }, function(res) {
            //> fail
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('駁回失敗')
                            .ariaLabel('rejectEpaper failed')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            console.log('rejectEpaper failed'); //> temp
        });

        self.setPage(self.pageEnum.MAIN_PAGE);
    };
});

//> approver filter
myEpaper.filter('approver', function() {
    return function(list) {
        var name = "";

        //> find name of current approver
        for(var i = 0; i < list.length; i++)
        {
            if(list[i].name && list[i].status == "approving")
            {
                name = list[i].name;
                break;
            }
        }

        return name;
    };
});

//> leave name filter
myEpaper.filter('leaveName', function() {
    return function(index, list) {
        return list.name[index];
    };
});

//> paper type filter
myEpaper.filter('paperType', function() {
    return function(type) {
        switch(type)
        {
            case 'leave':
                return "假單";
            default:
                return "無此類別";
        }
    };
});

//> paper status filter
myEpaper.filter('statusName', function() {
    return function(status) {
        switch(status)
        {
            case 'approving':
                return "簽核中";
            case 'done':
                return "已簽核";
            case 'rejected':
                return "駁回";
            default:
                return "無狀態";
        }
    };
});
