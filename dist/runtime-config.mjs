// Set once to the deployed Colyseus WSS origin when the front end is hosted separately.
export const PUBLIC_SERVER_URL='wss://paperio-pocket.onrender.com';
export function defaultServerURL(location){
 if(PUBLIC_SERVER_URL)return PUBLIC_SERVER_URL;
 if(location.hostname.endsWith('.chatgpt.site'))return '';
 return location.origin.replace(/^http/,'ws');
}

