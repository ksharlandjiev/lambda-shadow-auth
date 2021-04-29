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

var shadowFile = 'awskamen:$6$8nKhbBww$w1XNyp1XvSkMSMxwu/CFj4/Hmy1CC5v/xsdvHr7HOFhq2818E38hy0max4CkxmAFstR.fqAPhLjOp9xLf533p/:18745:0:99999:7:::';

exports.lambdaHandler = async (event) => {
console.log('=>', event.password)
        // const ret = await axios(url);
        response = {
            'statusCode': 404,
            'body': JSON.stringify({
                message: 'user not found',
                // location: ret.data.trim()
            })
        }
        authResponse= checkPassword(event.username, event.password);
        if(authResponse) {
            response = {
                authenticated: authResponse,
                Role: "arn:aws:iam::176341458743:role/AWSTransferFamilyServiceRole",
                HomeDirectory: "/awskamen-sftp-server/home/"+event.username.trim()
            }
        }
    return response
};

function checkPassword(username, password) {
    var fs = require('fs');
    file =  fs.readFileSync('./etc/shadow', 'utf8');

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
}