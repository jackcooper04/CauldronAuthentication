const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

async function refreshToken(refresh_token,auth) {
    return new Promise(async (resolve) => {
        let data = qs.stringify({
            'client_id': auth.CLIENT_ID,
            'scope': 'XboxLive.signin offline_access',
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: data
        };
        try {
            const response = await axios(config);
            resolve({refresh_token: response.data.refresh_token, access_token:response.data.access_token});
        } catch (err) {
            resolve(false);
        }
    });
}

/*
    Microsoft Authentication Flow:
    https://wiki.vg/Microsoft_Authentication_Scheme
*/


// Step One: Redeem Token
// Redeems token for access token and refresh token

async function redeemToken(azureCredentials,token) {
    let data = qs.stringify({
        'client_id': azureCredentials.CLIENT_ID,
        'scope': 'XboxLive.signin offline_access',
        'code': token,
        'redirect_uri': azureCredentials.REDIRECT_URI,
        'grant_type': 'authorization_code',
        'code_verifier': azureCredentials.VERIFY_CODE
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: data
    };
    try {
        const response = await axios(config);
        return {refresh_token: response.data.refresh_token};
    } catch (err) {
        throw new Error('REDEEM_FAIL');
    }
}

// Step Two: Authenticate with Xbox Live
// Authenticated Access Token with Xbox Live returning details about the user XBOX LIVE account
async function authenticateXboxLive(access_token) {
    let data = JSON.stringify({ "Properties": { "AuthMethod": "RPS", "SiteName": "user.auth.xboxlive.com", "RpsTicket": `d=${access_token}` }, "RelyingParty": "http://auth.xboxlive.com", "TokenType": "JWT" });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://user.auth.xboxlive.com/user/authenticate',
        headers: {
            'Content-Type': 'application/json',
        },
        data: data
    };
    try {
        const authXboxLive = await axios(config);
        return authXboxLive.data;
    } catch (err) {
        throw new Error('XBOXLIVE_AUTH_FAIL');
    }
}

// Step Three: Authorize with Mojang
// Authorizes the XBOX LIVE token to access api.minecraftservices.com


async function authorizeMojang(token) {
    let data = JSON.stringify({ "Properties": { "SandboxId": "RETAIL", "UserTokens": [token] }, "RelyingParty": "rp://api.minecraftservices.com/", "TokenType": "JWT" });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://xsts.auth.xboxlive.com/xsts/authorize',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };
    try {
        const authMojang = await axios(config);
        return authMojang.data;
    } catch (err) {
        throw new Error('MOJANG_FAIL');
    }
}

// Step Four: Authenticate with Minecraft
// Authenticates the current user to api.minecraftservices.com

async function authenticateMinecraft(token, xuid) {
    let data = JSON.stringify({
        "identityToken": `XBL3.0 x=${xuid};${token}`
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.minecraftservices.com/authentication/login_with_xbox',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };
    try {
        const mcAuth = await axios(config);
        return mcAuth.data;
    } catch (err) {
        throw new Error('MINECRAFT_FAIL');
    }
}

//Step Five: Verifies Ownership
// Verifies that the user owns a valid license of Minecraft

async function verifyMinecraft(access_token) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://api.minecraftservices.com/entitlements/mcstore',
        headers: {
            'Authorization': 'Bearer ' + access_token
        }
    };
    try {
        const verify = await axios(config)
        let verifyData = verify.data;
        let cert = fs.readFileSync(path.join(__dirname, 'mojang.pem'));  // get public key
        const verified = await jwt.verify(verifyData.signature, cert);
        return !!verified;
    } catch(err) {
        return false;
    }
}

// Step Six: Get Profile Data
// Retrieves Information regarding the user

async function getProfileData(access_token) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://api.minecraftservices.com/minecraft/profile',
        headers: {
            'Authorization': 'Bearer ' + access_token
        }
    };
    try {
        const profile = await axios(config)
        let profileData = profile.data;
        return { username: profileData.name, uuid: profileData.id };
    } catch {
        throw new Error('PROFILE_GET_ERROR');
    }
}





module.exports = {refreshToken, redeemToken, authenticateXboxLive, authorizeMojang, authenticateMinecraft, verifyMinecraft, getProfileData}