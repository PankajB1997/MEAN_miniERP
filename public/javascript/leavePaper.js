"use strict";

var myLeavePaper = angular.module('myLeavePaper', ['ngMaterial', 'ui.bootstrap', 'ngSanitize']);

myLeavePaper.controller('LeaveController', function($http, $window, $filter, $mdDialog) {
	var self = this;

	//=== variables ===

	self.employeesData    = null;
	self.leaveData        = null;
	self.myLeaveQuota     = null;
	self.myLeaveName	  = null;
	self.myLeaveInfo	  = null;
	self.myLeaveIndex     = 0;
	self.myLeaveStartDate = new Date();
	self.myLeaveStartTime = null;
	self.myLeaveEndTime   = null;
	self.myLeavePeriod    = null;
	self.myLeaveApprover  = null;
	self.myLeaveDeputy    = null;
	self.quotaMessage     = null;
	self.quotaEnough	  = false;

	//> if today is Sat. or Sun., than shift the date
	if(self.myLeaveStartDate.getDay() == 0)	//> Sun.
	{
		self.myLeaveStartDate = new Date(self.myLeaveStartDate.getFullYear(),
										 self.myLeaveStartDate.getMonth(),
										 self.myLeaveStartDate.getDate()+1);
	}
	else if(self.myLeaveStartDate.getDay() == 6)	//> Sat.
	{
		self.myLeaveStartDate = new Date(self.myLeaveStartDate.getFullYear(),
										 self.myLeaveStartDate.getMonth(),
										 self.myLeaveStartDate.getDate()+2);
	}

	self.myLeaveEndDate = self.myLeaveStartDate;
	self.minDate        = self.myLeaveStartDate;


	//> leave period
	self.leaveTime = [{
		value: 0,
		name: '上午'
	}, {
		value: 1,
		name: '下午'
	}];

	//> enum
    self.checkEnum = {
        CHECK_LEAVE_NAME: 30
    };


	//=== HTTP request ===

	//> get emploee data when loading
	$http.get('/api/employees', {params: {email: 'all'}}).then(function(res) {
        //> success
        self.employeesData = res.data;
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

    //> get leave quota of current user when loading
    $http.get('/api/userLeaveQuota').then(function(res) {
        //> success
        self.myLeaveQuota = res.data;
    }, function(res) {
        //> fail
        console.error(res);
    });


	//=== function ===

	//> get leave info
	self.getLeaveInfo = function(calPeriod) {
		if(self.myLeaveName)
		{
			self.myLeaveIndex = self.leaveData.name.indexOf(self.myLeaveName);
			self.myLeaveInfo  = self.leaveData.info[self.myLeaveIndex];
			calPeriod();
		}
		else
		{
			self.myLeaveIndex = 0;
			self.myLeaveInfo  = null;
		}
	};

	//> check category
	self.checkVisible = function(checkItem)
	{
		switch(checkItem)
		{
			case self.checkEnum.CHECK_LEAVE_NAME:
				return self.myLeaveName ? true : false;
		}
	}

	//> filter out weekend
	self.weekendFilter = function(date) {
    	var day = date.getDay();
    	return !(day === 0 || day === 6);
  	};

  	//> update self.minDate on self.myLeaveStartDate change
	self.setMinDate = function(calPeriod) {
		self.minDate = self.myLeaveStartDate;
		calPeriod();
  	};

  	//> calculate leave period
	self.calPeriod = function() {
		if(self.myLeaveEndTime && self.myLeaveStartTime && self.myLeaveName)
		{
			var yearDiff  = self.myLeaveEndDate.getFullYear() - self.myLeaveStartDate.getFullYear();
			var monthDiff = self.myLeaveEndDate.getMonth() - self.myLeaveStartDate.getMonth();
			var dateDiff  = self.myLeaveEndDate.getDate() - self.myLeaveStartDate.getDate();
			var quota     = self.myLeaveQuota.total[self.myLeaveIndex] -
					        self.myLeaveQuota.used[self.myLeaveIndex];

			//> end date must be the same with start date or after start date
			if(yearDiff > 0 ||	//> different year
			   (yearDiff >= 0 && monthDiff >= 0 && dateDiff >= 0) ||	//> end date >= start date
			   (yearDiff == 0 && monthDiff > 0 && dateDiff < 0))		//> different month in the same year
			{
				var lengthOfMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
				var period        = 0;
				var startYear     = self.myLeaveStartDate.getFullYear();
				var startMonth    = self.myLeaveStartDate.getMonth();
				var startDate     = self.myLeaveStartDate.getDate();
				var startDay      = self.myLeaveStartDate.getDay();
				var endYear       = self.myLeaveEndDate.getFullYear();
				var endMonth      = 0;
				var endDate       = self.myLeaveEndDate.getDate();

				//> calculate leaving period
				for(var i = startYear; i <= endYear; ++i)
				{
					//> cross years or not
					if(i != endYear)
					{
						endMonth = 11;	//> December
					}
					else
					{
						endMonth = self.myLeaveEndDate.getMonth();
					}

					//> February in leap year
					if((i % 4) == 0)
					{
						lengthOfMonth[1] = 29;
					}
					else
					{
						lengthOfMonth[1] = 28;
					}

					for(var j = (i == startYear) ? startMonth : 0; j <= endMonth; ++j)
					{
						for(var k = (j == startMonth) ? startDate : 1; k <= lengthOfMonth[j]; k++)
						{
							if(i == endYear && j == endMonth && k == endDate)	//> on end date
							{
								break;
							}
							else if(startDay != 0 && startDay != 6)	//> filter out weekend
							{
								period++;
							}

							startDay = (startDay == 6) ? 0 : startDay + 1;
						}
					}
				}

				self.myLeavePeriod = period;

				//> modify period according leaving time
				var length = self.myLeaveStartTime.value - self.myLeaveEndTime.value;

				if(period == 0)	//> same day
				{
					if(self.myLeaveEndTime.value < self.myLeaveStartTime.value)
					{
						self.myLeaveEndTime = self.myLeaveStartTime;
						self.myLeavePeriod = 0.5;

		                var myAlert = $mdDialog.alert()
		                                .clickOutsideToClose(true)
		                                .title('時段選擇錯誤')
		                                .htmlContent('上午至上午 : 0.5天<br>下午至下午 : 0.5天<br>上午至下午 : 1天')
		                                .ariaLabel('quota no enough')
		                                .ok('Got it');

		                $mdDialog.show(myAlert);
					}
					else
					{
						switch(length)
						{
							case 0:
								self.myLeavePeriod = 0.5;
								break;
							case -1:
								self.myLeavePeriod = 1;
								break;
							default:
								self.myLeavePeriod = 0;
						}
					}
				}
				else
				{
					switch(length)
					{
						case 0:
							self.myLeavePeriod += 0.5;
							break;
						case -1:
							self.myLeavePeriod += 1;
							break;
					}
				}

				if(self.myLeavePeriod > quota)
				{
					self.quotaEnough  = false;
					self.quotaMessage = '需要 ' + self.myLeavePeriod + '天，' + self.myLeaveName + '額度不夠';
				}
				else
				{
					self.quotaEnough  = true;
					self.quotaMessage = "使用" + self.myLeaveName + " " + self.myLeavePeriod + "天";
				}
			}
			else	//> modify date and time automatically
			{
				self.myLeaveEndDate = self.myLeaveStartDate;
				self.myLeaveEndTime = self.myLeaveStartTime;
				self.myLeavePeriod  = 0.5;
				self.quotaEnough    = true;
				self.quotaMessage   = "使用" + self.myLeaveName + " " + self.myLeavePeriod + "天";
			}
		}
		else	//> leave time is not selected
		{
			self.myLeavePeriod = null;
			self.quotaEnough   = false;
			self.quotaMessage  = null;
		}
	};

	//> check deputy
	self.checkDeputy = function() {
		return (self.myLeavePeriod >= 3) ? true : false;
	}

	//> check can submit or not
	self.checkSubmit = function() {
		//> check leave name
		var hasName = self.myLeaveName ? true : false;

		//> check date and time
		var hasDateTime = false;
		if(self.myLeaveEndTime && self.myLeaveStartTime)
		{
			hasDateTime = true;
		}

		//> check approver
		var hasApprover = self.myLeaveApprover ? true: false;

		//> check deputy
		var hasDeputy = false;
		if(self.myLeavePeriod >= 3)
		{
			hasDeputy = self.myLeaveDeputy ? true : false;
		}
		else if(0 < self.myLeavePeriod < 3)
		{
			hasDeputy = true;
		}

		return hasName && hasDateTime && hasApprover && hasDeputy && self.quotaEnough;
	};

	//> submit leave paper
	self.submitLeavePaper = function() {
		var application = {
			type: 'leave',
			data: {
				leaveIdx: self.myLeaveIndex,
				startDate: $filter('date')(self.myLeaveStartDate, 'yyyy-MM-dd'),
				endDate: $filter('date')(self.myLeaveEndDate, 'yyyy-MM-dd'),
				startTime: self.myLeaveStartTime.name,
				endTime: self.myLeaveEndTime.name,
				period: self.myLeavePeriod,
				approver: self.myLeaveApprover,
				deputy: self.myLeaveDeputy
			}
		};

		// async method
		$http.post('/api/addEpaper', application).then(function(res) {
			//> success
			var myAlert = $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('送出成功')
                            .ariaLabel('addEpaper failed')
                            .ok('Got it');

            console.log('addEpaper succeed');	//> temp

            $mdDialog.show(myAlert)
            		 .finally(function() {
            		 	//> go to /
						$window.location.href = '/';
            		 });
		}, function(res) {
			//> fail
			var myAlert = $mdDialog.alert()
            				.clickOutsideToClose(true)
                            .title('Breaking News')
                            .textContent('送出失敗')
                            .ariaLabel('addEpaper succeeded')
                            .ok('Got it');

            console.log('addEpaper failed');	//> temp

			$mdDialog.show(myAlert)
            		 .finally(function() {
            		 	//> go to /
						$window.location.href = '/';
            		 });
		});
	};
});

