function makeToken(text){
    const crypto = require('crypto'); 
    const algorithm = 'aes-256-cbc'; 
    const key = crypto.randomBytes(32); 
    const iv = crypto.randomBytes(16);
     
    function encrypt(text) { 
        let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
        let encrypted = cipher.update(text); 
        encrypted = Buffer.concat([encrypted, cipher.final()]); 
        return {    iv: iv.toString('hex'),  
                    encryptedData: encrypted.toString('hex') 
               }; 
    } 
    return encrypt(text).encryptedData; 
}

function nowInSeconds() {
    const now = new Date();
    return Math.round(now.getTime() / 1000);
}

const Repository = require('./models/Repository');
module.exports = 
class TokenManager{
    static repository = new Repository('Tokens');
    static tokenLifeDuration = 10 * 60 * 60; // 10 hours
    static create(email) {
        let token = {   Id: 0, 
                        Access_token: makeToken(email), 
                        Expires_in: nowInSeconds() + TokenManager.tokenLifeDuration
                    };
        TokenManager.repository.add(token);
        return token;
    }
    static cleanTokens() {
        let oneRemoved = false;
        do {
            oneRemoved = false;
            let tokens = TokenManager.repository.getAll();
            for(let token of tokens) {
                if (token.Expires_in < nowInSeconds()) {
                    TokenManager.repository.remove(token.Id);
                    oneRemoved = true;
                    break;
                }
            }
        } while (oneRemoved);
    }
    static find(access_token) {
        TokenManager.cleanTokens();
        let token = TokenManager.repository.findByField('Access_token', access_token);
        if (token != null){
            // renew expiration date
            token.Expires_in = nowInSeconds() + TokenManager.tokenLifeDuration;
            TokenManager.repository.update(token);
            return token;
        }
        return null;
    }
}