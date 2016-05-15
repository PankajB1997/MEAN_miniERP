var path         = require('path');
var nodemailer   = require('nodemailer');
var dbEmployees  = require('../module/dbEmployees');
var dbLeaveQuota = require('../module/dbLeaveQuota');
var dbDepartment = require('../module/dbDepartment');
var dbEpaper     = require('../module/dbEpaper');
var fileLocation = path.join(__dirname, '../public/views');

//> create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://username%40gmail.com:password@smtp.gmail.com');

//=== Functions ===

//> get all data of employees
function getEmployees(req, res)
{
    dbEmployees.find({}, {'password': 0}, function(err, employees) {
        if(err || !employees)
        {
            console.error('getEmployees failed');
            return res.status(500).send(err);
        }

        res.json(employees);
    });
};

//> return all data of departments
function getDepartments(req, res)
{
    dbDepartment.find(function(err, dep) {
        if(err || !dep)
        {
            console.error('getDepartments failed');
            return res.status(500).send(err);
        }

        res.json(dep);
    });
};

//> return all data of epapers
function getEpapers(req, res)
{
    dbEpaper.find({'applicant': req.session.user.email}, function(err, paper) {
        if(err)
        {
            console.error('epaper failed');
            return res.status(500).send(err);
        }

        res.json(paper);
    });
};

//=== routes ===

module.exports = function(app) {
    //> root
    app.get('/', checkLogin);
    app.get('/', function(req, res) {
        res.render('index', {
            user: (req.session.user != null) ? req.session.user.email : "",
            admin: (req.session.user != null) ? req.session.user.admin : false
        });
    });

    //> login
    app.get('/login',checkNotLogin);
    app.get('/login', function(req,res) {
        res.render('login',{
            user: (req.session.user != null) ? req.session.user.email : "",
            admin: (req.session.user != null) ? req.session.user.admin : false
        });
    });

    //> admin manage
    app.get('/adminManage',checkLogin);
    app.get('/adminManage', function(req,res) {
        res.render('adminManage',{
            user: (req.session.user != null) ? req.session.user.email : "",
            admin: (req.session.user != null) ? req.session.user.admin : false
        });
    });

    //> self manage
    app.get('/selfManage',checkLogin);
    app.get('/selfManage', function(req,res) {
        res.render('selfManage',{
            user: (req.session.user != null) ? req.session.user.email : "",
            admin: (req.session.user != null) ? req.session.user.admin : false
        });
    });

    //> leave paper
    app.get('/leavePaper',checkLogin);
    app.get('/leavePaper', function(req,res) {
        res.render('leavePaper',{
            user: (req.session.user != null) ? req.session.user.email : "",
            admin: (req.session.user != null) ? req.session.user.admin : false
        });
    });


    //=== APIs ===

    //> login
    app.post('/api/login', function(req, res) {
        dbEmployees.findOne({'email': req.body.email}, function(err, employee) {
            if(err)
            {
                return res.status(500).send(err);
            }

            if(employee)
            {
                if(req.body.password == employee.password)
                {
                    req.session.user = employee;
                    res.send('loginned');
                }
                else
                {
                    res.send('nouser');
                }
            }
            else
            {
                res.send('nouser');
            }
        });
    });

    //> logout
    app.get('/api/logout', function(req, res) {
        req.session.user = null;
        res.redirect('/login');
    });

    //> query employee data
    app.get('/api/employees', function(req, res) {
        console.log('email: ' + req.query.email);

        if(req.query.email == 'all')    //> return all employees' data
        {
            getEmployees(req, res);
        }
        else    //> return current user data
        {
            dbEmployees.findOne({'email': req.session.user.email}, function(err, emp) {
                if(err || !emp)
                {
                    console.error('employees findOne failed');
                    return res.status(500).send(err);
                }

                res.json(emp);
            });
        }
    });

    //> add an employee
    app.post('/api/addEmployee', function(req, res) {
        console.log('name: ' + req.body.name);
        console.log('email: ' + req.body.email);
        console.log('pw: ' + req.body.password);
        console.log('sex: ' + req.body.sex);
        console.log('department: ' + req.body.department);
        console.log('title: ' + req.body.title);
        console.log('onBoardDate: ' + req.body.onBoardDate.toString());
        console.log('admin: ' + req.body.admin);
        console.log('leaveQuota: ' + req.body.leaveQuota);

        var leaveUsed = [];
        for(var i = 0; i < req.body.leaveQuota.length; ++i)
        {
            leaveUsed.push(0);
        }

        //> create new employee
        var promise = dbEmployees.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            sex: req.body.sex,
            department: req.body.department,
            title: req.body.title,
            onBoardDate: req.body.onBoardDate,
            admin: req.body.admin
        }, function(err, data) {
            if(err)
            {
                console.error("[addEmployee] dbEmployees failed");
                return res.status(500).send(err);
            }
        });

        //> create leave quota for this new employee
        dbLeaveQuota.create({
            email: req.body.email,
            name: null,
            info: null,
            total: req.body.leaveQuota,
            used: leaveUsed
        }, function(err, data) {
            if(err)
            {
                console.error("[addEmployee] dbLeaveQuota failed");
                return res.status(500).send(err);
            }
        });

        //> add to corresponding department
        if(req.body.department)
        {
            dbDepartment.update({'name': req.body.department}, {$push: {'member': req.body.name, 'email': req.body.email, 'title': req.body.title}},
                function(err, data) {
                    if(err)
                    {
                        console.error('[addEmployee] update dbDepartment failed');
                        return res.status(500).send(err);
                    }
            });
        }

        //> send back employees' data
        promise.onResolve(function(err) {
            if(err)
            {
                console.error("[addEmployee] promise: dbEmployees failed");
            }

            getEmployees(req, res);
        });
    });

    //> update an employee basic info
    app.post('/api/updateEmpBasic', function(req, res) {
        console.log('id: ' + req.body.id);
        console.log('name: ' + req.body.name);
        console.log('oldEmail: ' + req.body.oldEmail);
        console.log('newEmail: ' + req.body.newEmail);
        console.log('sex: ' + req.body.sex);
        console.log('oldDep: ' + req.body.oldDep);
        console.log('newDep: ' + req.body.newDep);
        console.log('title: ' + req.body.title);
        console.log('onBoardDate: ' + req.body.onBoardDate.toString());
        console.log('admin: ' + req.body.admin);

        //> updata dbEmployees
        var promise = dbEmployees.findByIdAndUpdate(req.body.id, {'name': req.body.name,
                                                    'email': req.body.newEmail,
                                                    'sex': req.body.sex,
                                                    'department': req.body.newDep,
                                                    'title': req.body.title,
                                                    'onBoardDate': req.body.onBoardDate,
                                                    'admin': req.body.admin}).exec(function(err, employee) {
            if(err || !employee)
            {
                console.error('[updateEmpBasic] dbEmployees update failed');
                return res.status(500).send(err);
            }
        });

        //> update dbDepartment
        if(req.body.oldDep != req.body.newDep)  //> department is changed
        {
            if(req.body.oldDep) //> remove data from old department
            {
                dbDepartment.findOne({'name': req.body.oldDep}, function(err, employee) {
                    if(err || !employee)
                    {
                        console.error('[updateEmpBasic] dbDepartment update failed1');
                        return res.status(500).send(err);
                    }

                    var idx = employee.email.indexOf(req.body.oldEmail);

                    employee.member.splice(idx, 1);
                    employee.email.splice(idx, 1);
                    employee.title.splice(idx, 1);

                    employee.save();
                });
            }

            if(req.body.newDep) //> not null
            {
                dbDepartment.findOne({'name': req.body.newDep}, function(err, employee) {
                    if(err || !employee)
                    {
                        console.error('[updateEmpBasic] dbDepartment update failed2');
                        return res.status(500).send(err);
                    }

                    employee.member.push(req.body.name);
                    employee.email.push(req.body.newEmail);
                    employee.title.push(req.body.title);

                    employee.save();
                });
            }
        }
        else if(req.body.oldDep)    //> same department and not null
        {
            dbDepartment.findOne({'name': req.body.oldDep}, function(err, dep) {
                if(err || !dep)
                {
                    console.error('[updateEmpBasic] dbDepartment update failed3');
                    return res.status(500).send(err);
                }

                var idx = dep.email.indexOf(req.body.oldEmail);

                dep.member.set(idx, req.body.name);
                dep.email.set(idx, req.body.newEmail);
                dep.title.set(idx, req.body.title);

                dep.save();
            });
        }

        //> if email is changed, update dbLeaveQuota as well
        if(req.body.oldEmail != req.body.newEmail)
        {
            dbLeaveQuota.findOne({'email': req.body.oldEmail}, function(err, employee) {
                if(err || !employee)
                {
                    console.error('[updateEmpBasic] dbLeaveQuota update failed');
                    return res.status(500).send(err);
                }

                employee.email = req.body.newEmail;

                employee.save();
            });
        }

        promise.onResolve(function(err) {
            if(err)
            {
                return console.error("[updateEmpBasic] promise: dbEmployees failed");
            }

            //> return data
            getEmployees(req, res);
        });
    });

    //> update password of employee
    app.post('/api/updateEmpPw', function(req, res) {
        console.log('id: ' + req.body.id);
        console.log('pw: ' + req.body.pw);

        dbEmployees.findByIdAndUpdate(req.body.id, {'password': req.body.pw}, function(err, employee) {
            if(err || !employee)
            {
                console.error('updateEmpPw failed');
                return res.status(500).send(err);
            }

            res.send("ok");
        });
    });

    //> update leave quota of one employee
    app.post('/api/updateEmpLeave', function(req, res) {
        console.log('id: ' + req.body.id);
        console.log('total: ' + req.body.total);
        console.log('used: ' + req.body.used);

        dbLeaveQuota.findByIdAndUpdate(req.body.id, {'total': req.body.total, 'used': req.body.used}, function(err, employee) {
            if(err || !employee)
            {
                console.error('updateEmpLeave failed');
                return res.status(500).send(err);
            }

            res.send("ok");
        });
    });

    //> delete an employee
    app.post('/api/deleteEmployee', function(req, res) {
        console.log('department: ' + req.body.dep);
        console.log('email: ' + req.body.email);

        //> delete from dbEmployees
        var promise = dbEmployees.findOneAndRemove({'email': req.body.email}).exec(function(err, employee) {
            if(err || !employee)
            {
                console.error('[deleteEmployee] dbEmployees failed');
                return res.status(500).send(err);
            }
        });

        //> delete from dbDepartment
        dbDepartment.findOne({'name': req.body.dep}, function(err, dep) {
            if(err)
            {
                console.error('[deleteEmployee] dbDepartment update failed');
                return res.status(500).send(err);
            }

            if(dep)
            {
                var idx = dep.email.indexOf(req.body.email);

                dep.member.splice(idx, 1);
                dep.email.splice(idx, 1);
                dep.title.splice(idx, 1);

                dep.save();
            }
        });

        //> delete from dbLeaveQuota
        dbLeaveQuota.findOneAndRemove({'email': req.body.email}, function(err, employee) {
            if(err || !employee)
            {
                console.error('[deleteEmployee] dbLeaveQuota failed');
                return res.status(500).send(err);
            }
        });

        //> send back employees data
        promise.onResolve(function(err) {
            if(err)
            {
                return console.error("[deleteEmployee] promise: dbEmployees failed");
            }

            getEmployees(req, res);
        });
    });

    //> query leave info and quota
    app.get('/api/leaveData', function(req, res) {
        dbLeaveQuota.findOne({'email': 'leaveType'}, function(err, data) {
            if(err || !data)
            {
                console.error('leaveData failed');
                return res.status(500).send(err);
            }

            res.json(data);
        });
    });

    //> query leave quota of one specific employee
    app.get('/api/queryLeaveQuota', function(req, res) {
        console.log('email: ' + req.query.email);
        dbLeaveQuota.findOne({'email': req.query.email}, function(err, data) {
            if(err || !data)
            {
                console.error('queryLeaveQuota failed');
                return res.status(500).send(err);
            }

            res.json(data);
        });
    });

    //> get leave quota of current user
    app.get('/api/userLeaveQuota', function(req, res) {
        console.log('email: ' + req.session.user.email);
        dbLeaveQuota.findOne({'email': req.session.user.email}, function(err, data) {
            if(err || !data)
            {
                console.error('getUserLeaveQuota failed');
                return res.status(500).send(err);
            }

            res.json(data);
        });
    });

    //> add an leave category
    app.post('/api/addLeave', function(req, res) {
        console.log('name: ' + req.body.name);
        console.log('info: ' + req.body.info);
        console.log('total: ' + req.body.total);

        //> update dbLeaveQuota
        var promise = dbLeaveQuota.update({}, {$push: {'total': req.body.total, 'used': 0}}, {multi: true}).where('email').ne('leaveType')
                .exec(function(err, data) {
                    if(err || !data)
                    {
                        console.error('[addLeave] update employees failed');
                        return res.status(500).send(err);
                    }
                });

        //> add new leave category to all data of dbLeaveQuota
        dbLeaveQuota.update({'email': 'leaveType'}, {$push: {'name': req.body.name, 'info': req.body.info}}, function(err, raw) {
            if(err)
            {
                console.error('[addLeave] update leaveTpye failed');
                return res.status(500).send(err);
            }
        });

        //> send back leave data
        promise.onResolve(function(err) {
            if(err)
            {
                return console.error("[addLeave] promise: update employees failed");
            }

            //> retune leave type data
            dbLeaveQuota.findOne({'email': 'leaveType'}, function(err, data) {
                if(err || !data)
                {
                    console.error('[addLeave] find leaveType failed');
                    return res.status(500).send(err);
                }

                res.json(data);
            });
        });
    });

    //> update leave data
    app.post('/api/updateLeaveData', function(req, res) {
        console.log('id: ' + req.body.id);
        console.log('name: ' + req.body.name);
        console.log('info: ' + req.body.info);

        var promise = dbLeaveQuota.findByIdAndUpdate(req.body.id, {'name': req.body.name, 'info': req.body.info}).exec(function(err, employee) {
            if(err || !employee)
            {
                console.error('[updateLeaveInfo] update failed');
                return res.status(500).send(err);
            }
        });

        promise.onResolve(function(error) {
            if(error)
            {
                console.error('[updateLeaveInfo] promise failed');
                return res.status(500).send(err);
            }

            dbLeaveQuota.findById(req.body.id, function(err, data) {
                if(err || !data)
                {
                    console.error('[updateLeaveInfo] find failed');
                    return res.status(500).send(err);
                }

                res.json(data);
            });
        });
    });

    //> delete leave info
    app.post('/api/deleteLeaveData', function(req, res) {
        console.log('id: ' + req.body.id);
        console.log('index: ' + req.body.index);

        //> delete item based on index
        var promise = dbLeaveQuota.find().exec(function(err, data) {
            if(err || !data)
            {
                console.error('[deleteLeaveInfo] delete failed');
                return res.status(500).send(err);
            }

            data.forEach(function(item) {
                if(item.email == 'leaveType')
                {
                    item.name.splice(req.body.index, 1);
                    item.info.splice(req.body.index, 1);
                }
                else
                {
                    item.total.splice(req.body.index, 1);
                    item.used.splice(req.body.index, 1);
                }

                item.save();
            });
        });

        //> send back leave data
        promise.onResolve(function(error) {
            if(error)
            {
                console.error('[deleteLeaveInfo] promise failed');
                return res.status(500).send(err);
            }

            dbLeaveQuota.findById(req.body.id, function(err, data) {
                if(err || !data)
                {
                    console.error('[deleteLeaveInfo] find leaveType failed');
                    return res.status(500).send(err);
                }

                res.json(data);
            });
        });
    });

    //> query department info
    app.get('/api/departmentData', function(req, res) {
        console.log('departmentData+');
        getDepartments(req, res);
    });

    //> add an new department
    app.post('/api/addDepartment', function(req, res) {
        console.log('name: ' + req.body.name);

        //> create new department
        var promise = dbDepartment.create({
            name: req.body.name,
            subDep: [],
            member: [],
            email: [],
            title: []
        }, function(err, data) {
            if(err)
            {
                console.error("[addDepartment] dbDepartment failed");
                return res.status(500).send(err);
            }
        });

        //> send back data of department
        promise.onResolve(function(err) {
            if(err)
            {
                console.error("[addDepartment] promise: addDepartment failed");
            }

            getDepartments(req, res);
        });
    });

    //> delete one department
    app.post('/api/deleteDepartment', function(req, res) {
        console.log('name: ' + req.body.name);

        //> delete data from dbDepartment
        var promise = dbDepartment.findOneAndRemove({'name': req.body.name}).exec(function(err, dep) {
            if(err || !dep)
            {
                console.error('[deleteDepartment] deleteDepartment failed');
                return res.status(500).send(err);
            }
        });

        //> delete this department info of all employees
        dbEmployees.update({'department': req.body.name}, {$set: {'department': null}}, {multi: true}).where('email').ne('admin')
            .exec(function(err, data) {
                if(err)
                {
                    console.error('[deleteDepartment] update employees failed');
                    return res.status(500).send(err);
                }
        });

        promise.onResolve(function(err) {
            if(err)
            {
                console.error("[deleteDepartment] promise: dbDepartment failed");
            }

            //> return data
            getDepartments(req, res);
        });
    });

    //> update department
    app.post('/api/updateDepartment', function(req, res) {
        console.log('id: ' + req.body.id);
        console.log('oldName: ' + req.body.oldName);
        console.log('newName: ' + req.body.newName);

        //> update dbDepartment
        var promise = dbDepartment.findByIdAndUpdate(req.body.id, {'name': req.body.newName}).exec(function(err, dep) {
            if(err || !dep)
            {
                console.error('[updateDepartment] update failed');
                return res.status(500).send(err);
            }
        });

        //> update dbEmployee
        dbEmployees.update({'department': req.body.oldName}, {$set: {'department': req.body.newName}}, {multi: true}, function(err, raw) {
            if(err)
            {
                console.error('[updateDepartment] update dbEmployees failed');
                return res.status(500).send(err);
            }
        });

        promise.onResolve(function(err) {
            if(err)
            {
                console.error("[updateDepartment] promise: dbDepartment failed");
            }

            //> return data
            getDepartments(req, res);
        });
    });

    //> get all epapers
    app.get('/api/epaper', function(req, res) {
        console.log('user: ' + req.session.user.email);

        getEpapers(req, res);
    });

    //> get all epapers need user approval
    app.get('/api/epaper/approving', function(req, res) {
        console.log('user: ' + req.session.user.email);

        dbEpaper.find({approver: {$elemMatch: {name: req.session.user.email, status: 'approving'}}}, function(err, paper) {
            if(err)
            {
                console.error('epaper/approving failed');
                return res.status(500).send(err);
            }

            res.json(paper);
        });
    });

    //> get all epapers user approved
    app.get('/api/epaper/approved', function(req, res) {
        console.log('user: ' + req.session.user.email);

        //> find all user approved epapers
        dbEpaper.find({$or: [{approver: {$elemMatch: {name: req.session.user.email, status: 'done'}}},
                      {approver: {$elemMatch: {name: req.session.user.email, status: 'rejected'}}}]}, function(err, paper) {
            if(err)
            {
                console.error('epaper/approved failed');
                return res.status(500).send(err);
            }

            res.json(paper);
        });
    });

    //> add an epaper
    app.post('/api/addEpaper', function(req, res) {
        console.log('applicant :' + req.session.user.email);
        console.log('type :' + req.body.type);

        if(req.body.type == "leave")    //> leave epaper
        {
            console.log('data.leaveIdx: ' + req.body.data.leaveIdx);
            console.log('data.startDate: ' + req.body.data.startDate);
            console.log('data.endDate: ' + req.body.data.endDate);
            console.log('data.startTime: ' + req.body.data.startTime);
            console.log('data.endTime: ' + req.body.data.endTime);
            console.log('data.period: ' + req.body.data.period);
            console.log('data.deputy: ' + req.body.data.deputy);
            console.log('data.approver: ' + req.body.data.approver);

            var promise = dbEpaper.create({
                applicant: req.session.user.email,
                date: new Date(),
                type: req.body.type,
                status: 'approving',
                approver: [
                    {name: req.body.data.deputy, status: (req.body.data.deputy) ? 'approving' : null},
                    {name: req.body.data.approver, status: (req.body.data.deputy) ? 'wait' : 'approving'}
                ],
                data: {
                    leaveIdx: req.body.data.leaveIdx,
                    startDate: req.body.data.startDate,
                    endDate: req.body.data.endDate,
                    startTime: req.body.data.startTime,
                    endTime: req.body.data.endTime,
                    period: req.body.data.period
                },
                record: [
                    {name: (req.body.data.deputy) ? req.body.data.deputy : req.body.data.approver,
                     status: '簽核中', date: new Date()}
                ]
            }, function(err, epaper) {
                if(err)
                {
                    console.error('addEpaper failed');
                    return res.status(500).send(err);
                }
            });

            promise.onResolve(function(err) {
                if(err)
                {
                    console.error("promise: addEpaper failed");
                }
                res.send("ok");

                //> setup email data with unicode symbols
                var receiver = (req.body.data.deputy ? req.body.data.deputy : req.body.data.approver) + '<'
                               + (req.body.data.deputy ? req.body.data.deputy : req.body.data.approver) + '@kk.com>';
                console.error('receiver: ' + receiver);

                var mailOptions = {
                    from: 'User<user@gmail.com>',
                    to: receiver,
                    subject: '電子表單簽核通知[do not reply]',
                    html: '有表單等你簽核，請到下列網址查看<br><a href="http://localhost:3000/" target="_blank">前往審核</a>'
                };

                //> send email with defined transport object
                transporter.sendMail(mailOptions, function(err, info) {
                    if(err)
                    {
                        return console.log(err);
                    }

                    console.log('Message sent: ' + info.response);
                });
            });
        }
    });

    //> update epapre
    app.post('/api/approveEpaper', function(req, res) {
        console.log('id: ' + req.body.id);

        //> update epapre
        dbEpaper.findById(req.body.id, function(err, paper) {
            if(err || !paper)
            {
                console.error('approveEpaper failed');
                return res.status(500).send(err);
            }

            if(paper.type == 'leave')
            {
                //> check if all the approvers approved
                var allApproved = true;
                for(var i = 0; i < paper.approver.length; i++)
                {
                    if(paper.approver[i].name && paper.approver[i].status != 'done')
                    {
                        //> update status of approver
                        paper.approver[i].status = 'done';

                        //> update record
                        paper.record.push({name: paper.approver[i].name, status: '已簽核', date: new Date()});

                        //> check if the last approver
                        if(i != (paper.approver.length-1))
                        {
                            paper.approver[i+1].status = 'approving';
                            paper.record.push({name: paper.approver[i+1].name, status: '簽核中', date: new Date()});

                            //> setup email data with unicode symbols
                            var receiver = paper.approver[i+1].name + '<' + paper.approver[i+1].name + '@kk.com>';
                            console.error('receiver: ' + receiver);

                            var mailOptions = {
                                from: 'User<user@gmail.com>',
                                to: receiver,
                                subject: '電子表單簽核通知[do not reply]',
                                html: '有表單等你簽核，請到下列網址查看<br><a href="http://localhost:3000/" target="_blank">前往審核</a>'
                            };

                            //> send email with defined transport object
                            transporter.sendMail(mailOptions, function(err, info) {
                                if(err)
                                {
                                    return console.log(err);
                                }

                                console.log('Message sent: ' + info.response);
                            });

                            allApproved = false;
                        }
                        break;
                    }
                }

                if(allApproved) //> epaper is approved
                {
                    paper.status = 'done';

                    var updateObj = {};
                    updateObj['used.' + paper.data.leaveIdx] = paper.data.period;

                    //> update leave quota
                    dbLeaveQuota.update({'email': paper.applicant},{$set: updateObj}, function(err, raw) {
                        if(err)
                        {
                            console.error('[approveEpaper] dbLeaveQuota failed');
                            return res.status(500).send(err);
                        }
                    });
                }

                var promise = paper.save();

                //> send epapers data back
                promise.onResolve(function(err) {
                    if(err)
                    {
                        return console.error("promise: approveEpaper failed");
                    }

                    getEpapers(req, res);
                });
            }
        });
    });

    //> reject epapre
    app.post('/api/rejectEpaper', function(req, res) {
        console.log('id: ' + req.body.id);

        //> update dbEpaper
        dbEpaper.findById(req.body.id, function(err, paper) {
            if(err || !paper)
            {
                console.error('rejectEpaper failed');
                return res.status(500).send(err);
            }

            //> reject
            paper.status = 'rejected';

            //> record
            for(var i = 0; i < paper.approver.length; i++)
            {
                if(paper.approver[i].name && paper.approver[i].status != 'done')
                {
                    //> update status of approver
                    paper.approver[i].status = 'rejected';

                    //> update record
                    paper.record.push({name: paper.approver[i].name, status: '駁回', date: new Date()});
                    break;
                }
            }

            var promise = paper.save();

            //> send epapers data back
            promise.onResolve(function(err) {
                if(err)
                {
                    return console.error("promise: rejectEpaper failed");
                }

                getEpapers(req, res);
            });
        });
    });


    //=== router middleware ===

    function checkLogin(req,res,next)
    {
        if(!req.session.user)
        {
            res.redirect('/login');
            return;
        }
        next();
    }

    function checkNotLogin(req,res,next)
    {
        if(req.session.user)
        {
            res.redirect('back');
            return;
        }
        next();
    }
};
