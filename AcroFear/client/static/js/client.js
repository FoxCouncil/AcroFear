/* AcroFear Core - It's so hot...
 * Copyright (c) 2015-2016 Kyle "Fox" Polulak
 * I love you all. I did it for you, past. 
 */

Storage.prototype.setObject = function (key, value) {
    if (typeof value == typeof ' ') {
        value = { string: value };
    }
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function (key) {
    return JSON.parse(this.getItem(key));
}

var ACRO_FEAR_APP = angular.module("AcroFearApp", ['ngRoute', 'luegg.directives']);

ACRO_FEAR_APP.factory('$socket', function($rootScope) {

    var socket = io.connect();

    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        },
        removeListener: function(listener, callback) {
            socket.removeListener(listener, callback);
        }
    };
});

ACRO_FEAR_APP.factory('$user', function($rootScope, $socket) {

    var m_userData = null;

    return {
        setUser: function(c_userData, callback) {
            m_userData = c_userData;
        },
        getUser: function() {
            return m_userData;
        },
        getUsername: function() {
            return m_userData.username;
        },
        sendCommand: function(msg, args) {
            $socket.emit('command', { msg: msg, args: args });
        },
        sendChat: function(chat) {
            if (chat.charAt(0) == '/') {
                if (chat.indexOf(' ') == -1) {
                    this.sendCommand(chat.substring(1), undefined);
                } else {
                    this.sendCommand(chat.substring(1, chat.indexOf(' ', 1)).toLowerCase(), chat.slice(chat.indexOf(' ', 1) + 1));
                }                
                return false;
            } else {
                $socket.emit('chat', chat);
                return true;
            }
        }
    };
});

ACRO_FEAR_APP.config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/', {
        templateUrl: '/static/html/home.html',
        controller: 'HomeController'
    })
    .when('/connecting', {
        templateUrl: '/static/html/connecting.html',
        controller: 'ConnectingController'
    })
    .when('/connected', {
        templateUrl: '/static/html/connected.html',
        controller: 'ConnectedController'
    })
    .when('/welcome', {
        templateUrl: 'static/html/welcome.html',
        controller: 'WelcomeController'
    })
    .when('/login', {
        templateUrl: 'static/html/login.html',
        controller: 'LoginController'
    }).
    when('/register', {
        templateUrl: 'static/html/register.html',
        controller: 'RegisterController'
    }).
    when('/lobby', {
        templateUrl: 'static/html/lobby.html',
        controller: 'LobbyController'
    }).
    when('/play/:gameId', {
        templateUrl: 'static/html/play.html',
        controller: 'PlayController'
    }).
    otherwise({
        redirectTo: '/'
    });

    $locationProvider.html5Mode(true);
});

ACRO_FEAR_APP.controller('AcroFearController', function($location, $socket, $user) {

    $location.path('/connecting');

    $socket.on('set-state', function(c_state) {
        console.log(c_state);
        $location.path('/' + c_state);
    });

    $socket.on('read-string-memory', function(c_memObjKey) {
        $socket.emit('read-string-memory', { key: c_memObjKey, value: localStorage.getItem('s:' + c_memObjKey) });
    });

    $socket.on('write-string-memory', function(c_memObj) {
        localStorage.setItem('s:' + c_memObj.key, c_memObj.value)
    });

    $socket.on('delete-string-memory', function(c_memObjKey) {
        localStorage.removeItem('s:' + c_memObjKey);
    });

    $socket.on('read-object-memory', function(c_memObjKey) {
        $socket.emit('read-object-memory', { key: c_memObjKey, value: localStorage.getObject('o:' + c_memObjKey) });
    });

    $socket.on('write-object-memory', function(c_memObj) {
        localStorage.setObject('o:' + c_memObj.key, c_memObj.value);
    });

    $socket.on('delete-object-memory', function(c_memObjKey) {
        localStorage.removeItem('o:' + c_memObjKey);
    });

    $socket.on('connect', function() {
        $location.path('/connected');
    });

    $socket.on('disconnect', function() {
        $location.path('/connecting');
    });

    $socket.on('set-user', function(c_userDetails) {
        $user.setUser(c_userDetails);
    })
});

ACRO_FEAR_APP.controller('ConnectingController', function($scope, $socket) {
    $scope.numberOfRetries = 0;
    $socket.on('reconnect_attempt', function(retryTimes) {
        $scope.numberOfRetries = retryTimes;
    });

    $scope.$on('$destroy', function(event) {
        $socket.removeListener('reconnect_attempt');
    });
});

ACRO_FEAR_APP.controller('ConnectedController', function($scope, $socket) {
});

ACRO_FEAR_APP.controller('HomeController', function($location, $socket) {
        
});

ACRO_FEAR_APP.controller('WelcomeController', function($scope, $location, $socket) {
    $scope.loginButtonClick = function() {
        $location.path('/login');
    }

    $scope.registerButtonClick = function() {
        $location.path('/register');
    }
});

ACRO_FEAR_APP.controller('LoginController', function($scope, $location, $socket) {

    $scope.errorMessage = "";
    $scope.processingLogin = false;

    if (localStorage.getItem('mem:registration_email') != null) {
        $scope.email = localStorage.getItem('mem:registration_email');
        localStorage.removeItem('mem:registration_email');
    }

    $socket.on('loginResult', function(result) {
        $scope.processingLogin = false;

        if (!result.success) {
            $scope.errorMessage = result.msg;
        }
    });

    $scope.loginButtonClick = function() {
        if (!$scope.email) {
            $scope.errorMessage = "Need an email address...";
        } else if (!$scope.password) {
            $scope.errorMessage = "Need a password, to unlock stuff...";
        }  else {
            $scope.errorMessage = "";
            $scope.processingLogin = true;
            $socket.emit('login', {
                email: $scope.email,
                password: $scope.password
            });
        }
    }

    $scope.cancelButtonClick = function() {
        $location.path('/welcome');
    }

    $scope.$on('$destroy', function(event) {
        $socket.removeListener('loginResult');
    });
});

ACRO_FEAR_APP.controller('RegisterController', function($scope, $location, $socket) {

    $scope.errorMessage = "";
    $scope.processingRegistration = false;

    $socket.on('registrationResult', function(result) {
        $scope.processingRegistration = false;

        if (!result.success) {
            $scope.errorMessage = result.msg;
        } else {
            localStorage.setItem('mem:registration_email', result.email);
            $location.path('/login');
        }
    });

    $scope.registerButtonClick = function() {
        if (!$scope.email || !$scope.username) {
            $scope.errorMessage = "Need an email and username...";
        } else if (!$scope.password || !$scope.password2) {
            $scope.errorMessage = "Need a password, to lock stuff up...";
        } else if ($scope.password != $scope.password2) {
            $scope.errorMessage = "C'mon, the passwords need to match...";
        } else {
            $scope.errorMessage = "";
            $scope.processingRegistration = true;
            $socket.emit('register', {
                email: $scope.email,
                username: $scope.username,
                password: $scope.password
            });
        }
    }

    $scope.cancelButtonClick = function() {
        $location.path('/welcome');
    }
});

ACRO_FEAR_APP.controller('LobbyController', function($scope, $location, $socket, $user) {

    $scope.chatBuffer = [];
    $scope.roomName = '';
    $scope.roomCount = 0;
    $scope.roomList = [];

    $socket.on('chat', function(c_chatData) {
        var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;

        $scope.chatBuffer.push(c_chatData);
    });

    $socket.on('room-data', function(c_roomData) {
        $scope.roomName = c_roomData.name;
        $scope.roomCount = c_roomData.total;
        $scope.roomList = c_roomData.users;
    });

    $scope.sendChat = function() {
        if ($scope.chatinput) {
            if ($user.sendChat($scope.chatinput)) {
                $scope.chatBuffer.push({
                    who: $user.getUsername(),
                    timestamp: Date.now(),
                    type: 'msg-self',
                    value: $scope.chatinput
                });
            }

            $scope.chatinput = "";
        }
    }

    $user.sendCommand('join', 'lobby');

    $scope.$on('$destroy', function(event) {
        $socket.removeListener('chat');
        $socket.removeListener('room-data');
    });
});