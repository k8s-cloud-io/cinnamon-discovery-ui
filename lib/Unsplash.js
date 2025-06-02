const {HttpClient} = require('./lib/HttpClient');

const apiKey = `ajmbl4Asbr51ovYYmH9R537KPT2Y3w8XzE3G1niybjM`;

function Unsplash() {
    this.searchImage = (search) => {
        const unsplashApiUrl = `https://api.unsplash.com/photos/random?orientation=landscape&topics=weather&query=weather%20sky%20${decodeURIComponent(search.toLowerCase())}&count=5&client_id=${apiKey}`;
        return new HttpClient().exec('GET', unsplashApiUrl);
    }
}