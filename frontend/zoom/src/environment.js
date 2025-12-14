import 'dotenv/config'; 

let IS_PROD = true;
const server = IS_PROD ?
    "https://connect-hy5j.onrender.com" :
    "http://localhost:3000"


export default server;