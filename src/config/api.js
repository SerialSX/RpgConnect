const DEV_URL = "http://localhost:8080";
const PROD_URL = "https://rpgconnect-2077.onrender.com";

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEV_URL : PROD_URL);
