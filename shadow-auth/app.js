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

exports.lambdaHandler = async (event) => {
        const secret = await fetchSecret("SFTP/"+event.username);
        response = {
            'statusCode': 404,
            'body': JSON.stringify({
                message: 'user not found',
                // location: ret.data.trim()
            })
        }
        const authResponse = await checkPassword(secret, event.username, event.password);
        if(authResponse) {
            response = {
                authenticated: true,
                Role: secret.Role,
                HomeDirectory: secret.HomeDirectory
            }
        }
    return response
};
async function fetchSecret(secretName) {
    var AWS = require('aws-sdk');

// Create a Secrets Manager client
var client = new AWS.SecretsManager({
    region: 'us-east-1'
});

const result = await client
  .getSecretValue({
    SecretId: secretName
  })
  .promise();
  return JSON.parse(result.SecretString);
}

async function checkPassword(secret, username, password) {
    // var fs = require('fs');
    // file =  fs.readFileSync('./etc/shadow', 'utf8');
    let file = secret.Shadow || "";
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