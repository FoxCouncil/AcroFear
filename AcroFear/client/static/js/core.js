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

var ACRO_FEAR_APP = angular.module("AcroFearApp", ['ngRoute']);

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
    when('/play/:gameId', {
        templateUrl: 'static/html/play.html',
        controller: 'PlayController'
    }).
    otherwise({
        redirectTo: '/'
    });

    $locationProvider.html5Mode(true);
});

ACRO_FEAR_APP.controller('AcroFearController', function($location, $socket) {

    $location.path('/connecting');

    $socket.on('set-state', function(c_state) {
        console.log(c_state);
        $location.path('/' + c_state);
    });

    $socket.on('read-string-memory', function(c_memObjKey) {
        $socket.emit('read-string-memory', localStorage.getItem('s:' + c_memObjKey));
    });

    $socket.on('write-string-memory', function(c_memObj) {
        localStorage.setItem('s:' + c_memObj.key, c_memObj.value)
    });

    $socket.on('delete-string-memory', function(c_memObjKey) {
        localStorage.removeItem('s:' + c_memObjKey);
    });

    $socket.on('read-object-memory', function(c_memObjKey) {
        $socket.emit('read-object-memory', localStorage.getObject('o:' + c_memObjKey));
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
});

ACRO_FEAR_APP.controller('ConnectingController', function($scope, $socket) {
    $scope.numberOfRetries = 0;
    $socket.on('reconnect_attempt', function(retryTimes) {
        $scope.numberOfRetries = retryTimes;
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
    $scope.cancelButtonClick = function() {
        $location.path('/welcome');
    }
});

var ACRO_FEAR_APP2 = (function() {
    
    var m_instance;
    
    function Init() {
        
        $('body').empty().append($(document.createElement('canvas')))
        
        var m_isConnected = false;
        
        var m_showStats = true;
        
        var m_fps = 30;
        var m_actualFps = m_fps;
        var m_actualFpsFilter = 50;
        var m_timeNow;
        var m_timeLastUpdate = (new Date) * 1;

        var m_socket = io();
        var m_canvas = $('canvas').get(0);
        var m_context = m_canvas.getContext('2d');
        
        var m_drawTarget = null;
        
        var m_currentState = 'disconnected';
        
        function _rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

        function _hexToRgb(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });
            
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
        
        function _setState(c_state) {
            if (c_state == m_currentState) {
                console.log('[WARN] Trying to set the same state: ' + c_state);
                return;
            }
            
            console.log('Setting State: ' + c_state);
            
            _switchDrawTarget(c_state);

            m_currentState = c_state;
        }
        
        function _switchDrawTarget(c_state) {
            
            // build up or swap? (memory will decide)
            m_drawTarget = {};
            
            switch (c_state) {

                case 'login': {
                    m_drawTarget._stage = 0;
                    m_drawTarget._tick = 0;
                    m_drawTarget._draw = function() {
                        
                        if (m_drawTarget._tick > 3 && m_drawTarget._stage == 0) {
                            m_drawTarget._stage = 1;
                            m_drawTarget._tick = 0;
                        }

                        m_context.fillStyle = _rgbToHex(42, 200, 42);
                        m_context.font = "72px audimat_regular";
                        
                        var a_fontMeasurement = m_context.measureText('AcroFear');
                        
                        var a_yCoord = (m_canvas.height / 2) - 36;

                        if (m_drawTarget._stage == 1) {
                            
                            a_yCoord -= (m_drawTarget._tick + 1) * 10;

                            if (a_yCoord - (m_drawTarget._tick + 1) * 10 < a_yCoord - 150) {
                                m_drawTarget._stage = 2;
                                m_drawTarget._tick = 0
                            } 
                                                        
                        } else if (m_drawTarget._stage > 1) {
                            a_yCoord -= 150;
                        }
                        
                        m_context.fillText(
                            'AcroFear', 
                            ((m_canvas.width / 2) - a_fontMeasurement.width / 2), 
                            a_yCoord
                        );

                        m_drawTarget._tick++;
                    }
                }
                break;

                case 'connect': {
                    m_drawTarget._draw = function() {
                        var a_textString = 'AcroFear';
                            
                        m_context.fillStyle = _rgbToHex(42, 200, 42);
                        m_context.font = "72px audimat_regular";
                            
                        var a_fontMeasurement = m_context.measureText(a_textString);
                            
                        m_context.fillText(
                            a_textString, 
                            ((m_canvas.width / 2) - a_fontMeasurement.width / 2), 
                            ((m_canvas.height / 2) - 36)
                        );
                    }
                }
                break;
                
                case 'disconnect': {
                    m_drawTarget._drawDir = true;
                    m_drawTarget._drawIdx = 200;
                    m_drawTarget._draw = function () {
                        var a_textString = 'CONNECTING';
                        
                        m_context.fillStyle = _rgbToHex(m_drawTarget._drawIdx, m_drawTarget._drawIdx, m_drawTarget._drawIdx);
                        m_context.font = "64px audimat_regular";
                        
                        var a_fontMeasurement = m_context.measureText(a_textString);
                        
                        m_context.fillText(
                            a_textString, 
                            ((m_canvas.width / 2) - a_fontMeasurement.width / 2), 
                            ((m_canvas.height / 2) - 32)
                        );
                        
                        if (m_drawTarget._drawIdx >= 200) {
                            m_drawTarget._drawIdx = 200;
                            m_drawTarget._drawDir = false;
                        }
                        
                        m_drawTarget._drawDir ? m_drawTarget._drawIdx += 10 : m_drawTarget._drawIdx -= 10;
                        
                        if (m_drawTarget._drawIdx <= 60) {
                            m_drawTarget._drawIdx = 60;
                            m_drawTarget._drawDir = true;
                        }
                    }
                }
                break;
            }            
        }

        function _resizeWindow() {
            m_canvas.width = $(window).get(0).innerWidth;
            m_canvas.height = $(window).get(0).innerHeight;
        }
        
        function _drawOnlineStatus() {

            m_context.font = "12px audimat_regular";
            
            var a_statusText = 'OFFLINE';
            
            if (m_isConnected) {
                m_context.fillStyle = "#42FE42";
                a_statusText = 'ONLINE';
            } else {
                m_context.fillStyle = "#FE4242";
            }
            
            var a_actualFPS = m_actualFps.toFixed(1) >= m_fps ? m_fps.toFixed(1) : m_actualFps.toFixed(1);
            
            m_context.fillText('FPS:    ' + m_fps.toFixed(1) + 'fps', 10, m_canvas.height - 30);
            m_context.fillText('ACTUAL: ' + a_actualFPS + 'fps', 10, m_canvas.height - 20);
            m_context.fillText('STATUS: ' + a_statusText, 10, m_canvas.height - 10);
        }
        
        function _draw() {

            m_context.clearRect(0, 0, m_canvas.width, m_canvas.height);

            if (m_drawTarget != null && typeof m_drawTarget._draw == 'function') {
                m_drawTarget._draw();
            }
            
            var a_frameFps = 1000 / ((m_timeNow = new Date) - m_timeLastUpdate);
            
            if (m_timeNow != m_timeLastUpdate) {
                m_actualFps += (a_frameFps - m_actualFps) / m_actualFpsFilter;
                m_timeLastUpdate = m_timeNow;
            }

            if (m_showStats) {
                _drawOnlineStatus();
            }                        
        }
        
        $(window).on('resize', _resizeWindow);
        _resizeWindow();
        
        m_socket.on('connect', function () {
            m_isConnected = true;
            _setState('connect');
        });
        
        m_socket.on('disconnect', function () {
            m_isConnected = false;
            _setState('disconnect');
        });

        m_socket.on('set-state', function (c_state) {
            _setState(c_state);
            m_socket.emit('set-state', c_state);
        });
        
        m_socket.on('read-string-memory', function (c_memObjKey) {
            m_socket.emit('read-string-memory', localStorage.getItem('s:' + c_memObjKey));
        });
        
        m_socket.on('write-string-memory', function (c_memObj) {
            ;ocalStorage.setItem('s:' + c_memObj.key, c_memObj.value)
        });
        
        m_socket.on('delete-string-memory', function (c_memObjKey) {
            localStorage.removeItem('s:' + c_memObjKey);
        });
        
        m_socket.on('read-object-memory', function (c_memObjKey) {
            m_socket.emit('read-object-memory', localStorage.getObject('o:' + c_memObjKey));
        });
        
        m_socket.on('write-object-memory', function (c_memObj) {
            localStorage.setObject('o:' + c_memObj.key, c_memObj.value);
        });
        
        m_socket.on('delete-object-memory', function (c_memObjKey) {
            localStorage.removeItem('o:' + c_memObjKey);
        });
        
        setInterval(_draw, 1000 / m_fps);
        
        return {
            publicMethod: function() {
                console.log("The public can see me!");
            },
            
            VERSION: "0.1",
            
            ToggleStats: function() {
                m_showStats = !m_showStats;
            },

            IsConnected: function() {
                return m_isConnected;
            } 
        }; 
    };
    
    return {
        getInstance: function() {
            if (!m_instance) {
                m_instance = Init();
            }            
            return m_instance;
        }
    }; 
})();