// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

var shadowFile = './etc/shadow';

exports.lambdaHandler = async (event, context) => {
    console.log(event)
    try {
        // const ret = await axios(url);
        if (!event.username || !event.password || !userExist(event.username)) {
            response = {
                'statusCode': 404,
                'body': JSON.stringify({
                    message: 'user not found',
                    // location: ret.data.trim()
                })
            }
        }
        if (checkPassword(event.username, event.password)) {
            response = {
                'statusCode': 200,
                'body': JSON.stringify({
                    message: 'Authenticated!',
                    // location: ret.data.trim()
                })
            }
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

function userExist(username) {
    var fs = require('fs');

    fs.readFile(shadowFile, 'utf-8', function (err, file) {
        if (err) {
            console.error('Error: Can\'t open shadow file!');
            return false;
        }
        var shadowArray = file.toString().split('\n');
        var userFinded = false;
        shadowArray.forEach(function (line) {
            var line = line.split(":");
            console.log(line)
            if (line[0] === username) {
                userFinded = true;
            }
        });
        console.log('user found:', userFinded)
        return userFinded;

    });
}


function checkPassword(username, password) {
    var fs = require('fs');

    fs.readFile(shadowFile, 'utf-8', function (err, file) {
        if (err) {
            console.error('Error: Can\'t open shadow file!');
            return false;
        }
        var shadowArray = file.toString().split('\n');
        var passwordHash;

        shadowArray.forEach(function (line) {
            var shadowLine = line.split(":");
            if (shadowLine[0] === username) {
                passwordHash = shadowLine[1];

            }
        });
        if (passwordHash) {
            var shadowSplit = passwordHash.split('$');
            var algorithm = shadowSplit[1];
            var passwordSalt = shadowSplit[2];
            if (algorithm === '6') {
                var sha512crypt = require('sha512crypt-node');
                if (sha512crypt.sha512crypt(password, passwordSalt) === passwordHash) {
                    return true;
                } else {
                    return false;
                }
            } else if (algorithm === '1') {
                var exec = require("child_process").exec;
                exec('openssl passwd -1 -salt $salt $pass', {
                    env: {
                        salt: passwordSalt,
                        pass: password
                    }
                }, function (err, stdout, stderr) {
                    if (stdout.trim() === passwordHash) {
                        return true;
                    } else {
                        return false;
                    }
                });
            }
        } else {
            return false;
        }
    });
}