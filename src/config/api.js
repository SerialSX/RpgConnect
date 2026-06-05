const getApiUrl = () => {
    if (typeof window !== "undefined" && window.location) {
        return `http://${window.location.hostname}:8080`;
    }
    return "http://localhost:8080";
};

export const API_URL = getApiUrl();
