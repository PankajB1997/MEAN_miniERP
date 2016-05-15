"use strict";

var myAdminManage = angular.module('myAdminManage', ['ngMaterial', 'angular-md5']);

myAdminManage.controller('ManageController', function($http, $window, $filter, $mdDialog, md5) {
    var self = this;


    //=== Variables ===

    self.employeesData        = null;
    self.tmpOldEmail          = null;
    self.tmpOldDepartment     = null;
    self.newLeaveName         = null;
    self.newLeaveInfo         = null;
    self.newLeaveTotal        = null;
    self.newLeaveQuota        = [];
    self.currentEmployee      = null;
    self.leaveData            = null;
    self.tmpLeaveData         = null;
    self.tmpLeaveIndex        = null;
    self.employeeLeaveQuota   = null;
    self.currentEmpLeaveQuota = null;
    self.dataHaveChanged      = false;
    self.departmentData       = null;
    self.newDepartmentName    = null;
    self.tmpOldDepName        = null;
    self.currentDep           = null;

    //> object
    //> this must be synced with dbEmployees.js
    self.newEmployee = {
        name: "",
        email: "",
        password: "",
        sex: "male",
        department: "",
        title: "",
        onBoardDate: new Date(),
        admin: false
    };

    //> enum
    self.pageEnum = {
        OVERVIEW_PAGE: 1,
        EMPLOYEE_PAGE: 10,
        EMPLOYEE_MAIN_PAGE: 11,
        EMPLOYEE_VIEW_PAGE: 12,
        EMPLOYEE_ADD_PAGE_1: 13,
        EMPLOYEE_ADD_PAGE_2: 14,
        EMPLOYEE_MODIFY_BASIC_PAGE: 15,
        EMPLOYEE_ADD_DEP_PAGE: 16,
        EMPLOYEE_VIEW_DEP_PAGE: 17,
        EMPLOYEE_MODIFY_DEP_PAGE: 18,
        LEAVE_PAGE: 20,
        LEAVE_MAIN_PAGE: 21,
        LEAVE_ADD_PAGE: 22,
        LEAVE_MODIFY_INFO_PAGE: 23,
        LEAVE_QUOTA_PAGE: 24,
        LEAVE_MODIFY_QUOTA_PAGE: 25,
        END: 30
    };

    self.pageMask = self.pageEnum.OVERVIEW_PAGE;


    //=== HTTP request ===

    //> get emploee data
    function getEmployeeData()
    {
        $http.get('/api/employees', {params: {email: 'all'}}).then(function(res) {
            //> success
            self.employeesData = res.data;
        }, function(res) {
            //> fail
            console.error(res);
        });
    };

    //> get department data
    function getDepartmentData()
    {
        $http.get('/api/departmentData').then(function(res) {
            //> success
            self.departmentData = res.data;
        }, function(res) {
            //> fail
            console.error(res);
        });
    };

    //> get leave data when loading
    $http.get('/api/leaveData').then(function(res) {
        //> success
        self.leaveData = res.data;
    }, function(res) {
        //> fail
        console.error(res);
    });

    //> get emploee data when loading
    getEmployeeData();

    //> get department data when loading
    getDepartmentData();


    //=== Functions ===

    //> set page
    self.setPage = function(page)
    {
        switch(page)
        {
            case self.pageEnum.EMPLOYEE_MAIN_PAGE:
                //> clean data
                self.newEmployee.name        = "";
                self.newEmployee.email       = "";
                self.newEmployee.password    = "";
                self.newEmployee.sex         = "male";
                self.newEmployee.department  = "";
                self.newEmployee.title       = "";
                self.newEmployee.onBoardDate = new Date();
                self.newEmployee.admin       = false;
                self.empSearchObj            = "";
                self.tmpOldEmail             = null;
                self.tmpOldDepartment        = null;
                self.currentEmployee         = null;
                self.newDepartmentName       = null;
                self.tmpOldDepName           = null;
                self.currentDep              = null;
                break;
            case self.pageEnum.EMPLOYEE_ADD_PAGE_1:
                //> clean data
                self.newLeaveQuota = [];
                break;
            case self.pageEnum.EMPLOYEE_MODIFY_BASIC_PAGE:
            case self.pageEnum.EMPLOYEE_MODIFY_DEP_PAGE:
                //> clean data
                self.dataHaveChanged = false;
                break;
            case self.pageEnum.LEAVE_MAIN_PAGE:
                //> clean data
                self.leaveSearchObj          = "";
                self.tmpLeaveData            = null;
                self.tmpLeaveIndex           = null;
                self.newLeaveName            = null;
                self.newLeaveInfo            = null;
                self.newLeaveTotal           = null;
                self.currentEmpLeaveQuota    = null;
                break;
            case self.pageEnum.LEAVE_MODIFY_QUOTA_PAGE:
                //> clean data
                self.dataHaveChanged = false;
                break;
        }

        //> set the page mask
        self.pageMask = page;
    }

    //> search function for employeesData.findIndex()
    function searchEmpIdx(element, index, array) {
        if(element.email == self.tmpOldEmail)
        {
            return true;
        }

        return false;
    };

    //> search function for departmentData.findIndex()
    function searchDepIdx(element, index, array) {
        if(element.name == self.tmpOldDepName)
        {
            return true;
        }

        return false;
    };

    //> change to employee view page
    self.setEmpBasicViewPage = function(email) {
        self.tmpOldEmail = email;

        //> find index
        var idx = self.employeesData.findIndex(searchEmpIdx);

        //> copy data
        self.currentEmployee = angular.copy(self.employeesData[idx]);
        self.currentEmployee.onBoardDate = new Date(self.currentEmployee.onBoardDate);

        //> record old department
        self.tmpOldDepartment = self.currentEmployee.department;

        self.setPage(self.pageEnum.EMPLOYEE_VIEW_PAGE);
    };

    //> change to employee view page
    self.setDepViewPage = function(name, page) {
        self.tmpOldDepName = name;
        var idx = self.departmentData.findIndex(searchDepIdx);

        self.currentDep = angular.copy(self.departmentData[idx]);

        self.setPage(page);
    };

    //> change to leave quota page
    self.setLeaveQuotaViewPage = function(email) {
        $http.get('/api/queryLeaveQuota', {params: {email: email}}).then(function(res) {
                //> success
                self.currentEmpLeaveQuota = res.data;
            }, function(res) {
                //> fail
                alert("server error");
                console.error(res);
        });

        self.setPage(self.pageEnum.LEAVE_QUOTA_PAGE);
    };

    //> change to leave category modify page
    self.setLeaveModifyInfoPage = function(index) {
        self.tmpLeaveIndex = index;
        self.tmpLeaveData  = angular.copy(self.leaveData);

        self.setPage(self.pageEnum.LEAVE_MODIFY_INFO_PAGE);
    };

    //> show selected page
    self.showPage = function(page) {
        switch(page)
        {
            case self.pageEnum.OVERVIEW_PAGE:
                return (self.pageMask >= self.pageEnum.OVERVIEW_PAGE && self.pageMask < self.pageEnum.EMPLOYEE_PAGE);
            case self.pageEnum.EMPLOYEE_PAGE:
                return (self.pageMask >= self.pageEnum.EMPLOYEE_PAGE && self.pageMask < self.pageEnum.LEAVE_PAGE);
            case self.pageEnum.EMPLOYEE_MAIN_PAGE:
                return (self.pageMask == self.pageEnum.EMPLOYEE_PAGE || self.pageMask == self.pageEnum.EMPLOYEE_MAIN_PAGE);
            case self.pageEnum.EMPLOYEE_VIEW_PAGE:
                return (self.pageMask == self.pageEnum.EMPLOYEE_VIEW_PAGE);
            case self.pageEnum.EMPLOYEE_ADD_PAGE_1:
                return (self.pageMask == self.pageEnum.EMPLOYEE_ADD_PAGE_1);
            case self.pageEnum.EMPLOYEE_ADD_PAGE_2:
                return (self.pageMask == self.pageEnum.EMPLOYEE_ADD_PAGE_2);
            case self.pageEnum.EMPLOYEE_MODIFY_BASIC_PAGE:
                return (self.pageMask == self.pageEnum.EMPLOYEE_MODIFY_BASIC_PAGE);
            case self.pageEnum.EMPLOYEE_ADD_DEP_PAGE:
                return (self.pageMask == self.pageEnum.EMPLOYEE_ADD_DEP_PAGE);
            case self.pageEnum.EMPLOYEE_VIEW_DEP_PAGE:
                return (self.pageMask == self.pageEnum.EMPLOYEE_VIEW_DEP_PAGE);
            case self.pageEnum.EMPLOYEE_MODIFY_DEP_PAGE:
                return (self.pageMask == self.pageEnum.EMPLOYEE_MODIFY_DEP_PAGE);
            case self.pageEnum.LEAVE_PAGE:
                return (self.pageMask >= self.pageEnum.LEAVE_PAGE && self.pageMask < self.pageEnum.END);
            case self.pageEnum.LEAVE_MAIN_PAGE:
                return (self.pageMask == self.pageEnum.LEAVE_PAGE || self.pageMask == self.pageEnum.LEAVE_MAIN_PAGE);
            case self.pageEnum.LEAVE_ADD_PAGE:
                return (self.pageMask == self.pageEnum.LEAVE_ADD_PAGE);
            case self.pageEnum.LEAVE_MODIFY_INFO_PAGE:
                return (self.pageMask == self.pageEnum.LEAVE_MODIFY_INFO_PAGE);
            case self.pageEnum.LEAVE_QUOTA_PAGE:
                return (self.pageMask == self.pageEnum.LEAVE_QUOTA_PAGE);
            case self.pageEnum.LEAVE_MODIFY_QUOTA_PAGE:
                return (self.pageMask == self.pageEnum.LEAVE_MODIFY_QUOTA_PAGE);
        }
    }

    //> filter out weekend
    self.weekendFilter = function(date) {
        var day = date.getDay();
        return !(day === 0 || day === 6);
    };

    //> indicate that data of employee have changed
    self.employeeDataChange = function() {
        self.dataHaveChanged = true;
    }

    //> check need to update data of employee or not
    self.checkDataChanged = function() {
        return !self.dataHaveChanged;
    }

    //> check step 1 of adding an employee
    self.checkAddEmployeeStep1 = function() {
        return self.newEmployee.name && self.newEmployee.email && self.newEmployee.password &&
               self.newEmployee.sex && self.newEmployee.title;
    };

    //> check step 2 of adding an employee
    self.checkAddEmployeeSubmit = function() {
        if(self.leaveData)
        {
            if(self.newLeaveQuota.length == self.leaveData.name.length)
            {
                for(var i = 0 ; i < self.newLeaveQuota.length; i++)
                {
                    if(self.newLeaveQuota[i] == null)
                    {
                        return true;
                    }
                }
                return false;
            }
        }
        return true;
    };

    //> check add an new department
    self.checkAddDepSubmit = function()
    {
        return self.newDepartmentName;
    }

    //> check add an leave categpry
    self.checkAddLeaveSubmit = function() {

        return (self.newLeaveName && self.newLeaveInfo && self.newLeaveTotal);
    };

    //> add new employee
    self.addEmployeeSubmit = function() {
        var passwordMd5 = md5.createHash(self.newEmployee.password);    //> create md5 of password

        var employeeData = {
            name: self.newEmployee.name,
            email: self.newEmployee.email,
            password: passwordMd5,
            sex: self.newEmployee.sex,
            department: self.newEmployee.department,
            title: self.newEmployee.title,
            onBoardDate: $filter('date')(self.newEmployee.onBoardDate, 'yyyy-MM-dd'),
            admin: self.newEmployee.admin,
            leaveQuota: self.newLeaveQuota
        };

        $http.post('/api/addEmployee', employeeData).then(function(res) {
            //> success
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('新增成功')
                            .ariaLabel('addEmployee succeeded')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            self.employeesData = res.data;

            //> get department data
            getDepartmentData();

            console.log('add employee succeeded');  //> temp
        }, function(res) {
            //> fail
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('新增失敗')
                            .ariaLabel('addEmployee failed')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            console.log('add employee failed'); //> temp
        });

        self.setPage(self.pageEnum.EMPLOYEE_MAIN_PAGE);
    };

    //> delete data of employee
    self.deleteEmployee = function(ev) {
        var confirm = $mdDialog.confirm()
                        .title('刪除資料')
                        .textContent('將此員工的資料完全刪除')
                        .ariaLabel('delete employee')
                        .targetEvent(ev)
                        .ok('確認')
                        .cancel('取消');

        $mdDialog.show(confirm).then(function() {
            //> user confirm
            var data = {
                dep: self.currentEmployee.department,
                email: self.currentEmployee.email};

            $http.post('/api/deleteEmployee', data).then(function(res) {
                //> success
                var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('刪除成功')
                            .ariaLabel('deleteEmployee succeeded')
                            .ok('Got it');

                $mdDialog.show(myAlert);

                self.employeesData = res.data;

                //> get department data
                getDepartmentData();

                console.log('delete employee succeeded');  //> temp
            }, function(res) {
                //> fail
                var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('刪除失敗')
                            .ariaLabel('deleteEmployee failed')
                            .ok('Got it');

                $mdDialog.show(myAlert);

                console.log('delete employee failed'); //> temp
            });

            self.setPage(self.pageEnum.EMPLOYEE_MAIN_PAGE);
        }, function() {
            //> user cancel
        });
    };

    //> update basic data of employee
    self.updateEmpBasicSubmit = function() {
        var employeeData = {
            id : self.currentEmployee._id,
            name: self.currentEmployee.name,
            oldEmail: self.tmpOldEmail,
            newEmail: self.currentEmployee.email,
            password: self.currentEmployee.password,
            sex: self.currentEmployee.sex,
            oldDep: self.tmpOldDepartment,
            newDep: self.currentEmployee.department,
            title: self.currentEmployee.title,
            onBoardDate: $filter('date')(self.currentEmployee.onBoardDate, 'yyyy-MM-dd'),
            admin: self.currentEmployee.admin
        };

        $http.post('/api/updateEmpBasic', employeeData).then(function(res) {
            //> success
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('更新成功')
                            .ariaLabel('updateEmpBasic succeeded')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            self.employeesData = res.data;

            //> get department data
            getDepartmentData();

            console.log('update employee succeeded');  //> temp
        }, function(res) {
            //> fail
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('更新失敗')
                            .ariaLabel('updateEmpBasic failed')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            console.log('update employee failed'); //> temp
        });

        self.setPage(self.pageEnum.EMPLOYEE_MAIN_PAGE);
    };

    //> add new department
    self.addDepartmentSubmit = function() {
        var depData = {
            name: self.newDepartmentName
        };

        $http.post('/api/addDepartment', depData).then(function(res) {
            //> success
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('新增成功')
                            .ariaLabel('addDepartment succeeded')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            self.departmentData = res.data;
            console.log('add department succeeded');  //> temp
        }, function(res) {
            //> fail
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('新增失敗')
                            .ariaLabel('addDepartment failed')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            console.log('add department failed'); //> temp
        });

        self.setPage(self.pageEnum.EMPLOYEE_MAIN_PAGE);
    };

    //> delete one department
    self.deleteDepartment = function(ev) {
        var confirm = $mdDialog.confirm()
                        .title('此部門將完全刪除')
                        .textContent('該部門下全體員工，其部門資料也會被刪除')
                        .ariaLabel('delete department')
                        .targetEvent(ev)
                        .ok('確認')
                        .cancel('取消');

        $mdDialog.show(confirm).then(function() {
            //> user confirm

            var depData = {
                name: self.currentDep.name
            };

            $http.post('/api/deleteDepartment', depData).then(function(res) {
                //> success
                var myAlert = $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Breaking News')
                                .textContent('刪除成功')
                                .ariaLabel('deleta department')
                                .ok('Got it');

                $mdDialog.show(myAlert);

                self.departmentData = res.data;

                //> get emploee data
                getEmployeeData();

                console.log('deleta department succeeded');  //> temp
            }, function(res) {
                //> fail
                var myAlert = $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Breaking News')
                                .textContent('刪除失敗')
                                .ariaLabel('deleta leave info failed')
                                .ok('Got it');

                $mdDialog.show(myAlert);

                console.log('deleta department failed'); //> temp
            });

            self.setPage(self.pageEnum.EMPLOYEE_MAIN_PAGE);
        }, function() {
            //> user cancel
        });
    };

    //> update a department
    self.updateDepSubmit = function(ev) {
        var confirm = $mdDialog.confirm()
                        .title('更新資料')
                        .textContent('此更新將套用到該部門下全體員工')
                        .ariaLabel('update department')
                        .targetEvent(ev)
                        .ok('確認')
                        .cancel('取消');

        $mdDialog.show(confirm).then(function() {
            //> user confirm

            var depData = {
                id: self.currentDep._id,
                oldName: self.tmpOldDepName,
                newName: self.currentDep.name
            };

            //> HTTP POST
            $http.post('/api/updateDepartment', depData).then(function(res) {
                //> success
                var myAlert = $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Breaking News')
                                .textContent('更新成功')
                                .ariaLabel('updateDepartment succeeded')
                                .ok('Got it');

                $mdDialog.show(myAlert);

                self.departmentData = res.data;

                //> get emploee data
                getEmployeeData();

                console.log('update department succeeded');  //> temp
            }, function(res) {
                //> fail
                var myAlert = $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Breaking News')
                                .textContent('更新失敗')
                                .ariaLabel('updateDepartment failed')
                                .ok('Got it');

                $mdDialog.show(myAlert);

                console.log('update department failed'); //> temp
            });

            self.setPage(self.pageEnum.EMPLOYEE_MAIN_PAGE);
        }, function() {
            //> user cancel
        });
    };

    //> add new leave category
    self.addLeaveSubmit = function() {
        var leaveData = {
            name: self.newLeaveName,
            info: self.newLeaveInfo,
            total: self.newLeaveTotal
        };

        $http.post('/api/addLeave', leaveData).then(function(res) {
            //> success
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('新增成功')
                            .ariaLabel('addLeave succeeded')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            self.leaveData = res.data;
            console.log('add leave succeeded');  //> temp
        }, function(res) {
            //> fail
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('新增失敗')
                            .ariaLabel('addLeave failed')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            console.log('add leave failed'); //> temp
        });

        self.setPage(self.pageEnum.LEAVE_MAIN_PAGE);
    };

    //> update info of one leave category
    self.updateLeaveDataSubmit = function(ev) {
        var confirm = $mdDialog.confirm()
                        .title('更新資料')
                        .textContent('此更新將套用到全體員工')
                        .ariaLabel('update leave')
                        .targetEvent(ev)
                        .ok('確認')
                        .cancel('取消');

        $mdDialog.show(confirm).then(function() {
            //> user confirm

            var leaveData = {
                id: self.leaveData._id,
                name: self.tmpLeaveData.name,
                info: self.tmpLeaveData.info
            };

            $http.post('/api/updateLeaveData', leaveData).then(function(res) {
                //> success
                var myAlert = $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Breaking News')
                                .textContent('更新成功')
                                .ariaLabel('updateLeaveData succeeded')
                                .ok('Got it');

                $mdDialog.show(myAlert);

                self.leaveData = res.data;
                console.log('update leave info succeeded');  //> temp
            }, function(res) {
                //> fail
                var myAlert = $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Breaking News')
                                .textContent('更新失敗')
                                .ariaLabel('updateLeaveData failed')
                                .ok('Got it');

                $mdDialog.show(myAlert);

                console.log('update leave info failed'); //> temp
            });

            self.setPage(self.pageEnum.LEAVE_MAIN_PAGE);
        }, function() {
            //> user cancel
        });
    };

    //> update leave quota of employee
    self.updateLeaveQuotaSubmit = function() {
        var employeeData = {
            id: self.currentEmpLeaveQuota._id,
            total: self.currentEmpLeaveQuota.total,
            used: self.currentEmpLeaveQuota.used
        };

        $http.post('/api/updateEmpLeave', employeeData).then(function(res) {
            //> success
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('更新成功')
                            .ariaLabel('updateEmpLeave succeeded')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            console.log('update employee leave succeeded');  //> temp
        }, function(res) {
            //> fail
            var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('更新失敗')
                            .ariaLabel('updateEmpLeave failed')
                            .ok('Got it');

            $mdDialog.show(myAlert);

            console.log('update employee leave failed'); //> temp
        });

        self.setPage(self.pageEnum.LEAVE_MAIN_PAGE);
    };

    //> delete one leave category
    self.deleteLeaveData = function(ev, index) {
        var confirm = $mdDialog.confirm()
                        .title('此假別將完全刪除')
                        .textContent('全體員工該假別資料也會刪除')
                        .ariaLabel('delete leave data')
                        .targetEvent(ev)
                        .ok('確認')
                        .cancel('取消');

        $mdDialog.show(confirm).then(function() {
            //> user confirm

            var leaveData = {
                id: self.leaveData._id,
                index: index
            };

            $http.post('/api/deleteLeaveData', leaveData).then(function(res) {
                //> success
                var myAlert = $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Breaking News')
                                .textContent('刪除成功')
                                .ariaLabel('deleta leave data succeeded')
                                .ok('Got it');

                $mdDialog.show(myAlert);

                self.leaveData = res.data;
                console.log('deleta leave data succeeded');  //> temp
            }, function(res) {
                //> fail
                var myAlert = $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Breaking News')
                                .textContent('刪除失敗')
                                .ariaLabel('deleta leave data failed')
                                .ok('Got it');

                $mdDialog.show(myAlert);

                console.log('deleta leave data failed'); //> temp
            });

            self.setPage(self.pageEnum.LEAVE_MAIN_PAGE);
        }, function() {
            //> user cancel
        });
    };
});
