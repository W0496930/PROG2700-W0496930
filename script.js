$(document).ready(function () {
    const apiKey = "bf4c9906c870ca072421a37ad88a25d8"; // Replace with your API key
    const weatherInfo = $("#weatherInfo");
    const forecastInfo = $("#forecastInfo");
    const searchHistoryEl = $("#searchHistory");
    const favoritesEl = $("#favorites"); // New favorites section
    const unitToggleBtn = $(".unit-toggle-btn");
    let isMetric = true; 
    let currentCity = ""; 

    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    let favoriteCities = JSON.parse(localStorage.getItem("favoriteCities")) || [];
    updateSearchHistory();
    updateFavorites();

    // getting the weather data
    const fetchWeather = _.debounce(async (city) => {
        if (!city) return;
        currentCity = city; 
        
        const unit = isMetric ? "metric" : "imperial";
        const tempUnit = isMetric ? "°C" : "°F";
        const windUnit = isMetric ? "m/s" : "mph";

        try {
            const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`);
            const data = weatherResponse.data;
            
            weatherInfo.html(`
                <h2>${data.name} <button class="fav-btn" data-city="${data.name}">⭐</button></h2>
                <p>🌡 Temperature: ${data.main.temp} ${tempUnit}</p>
                <p>💨 Wind Speed: ${data.wind.speed} ${windUnit}</p>
                <p>💧 Humidity: ${data.main.humidity}%</p>
            `);

            // 5-day forecast
            fetchForecast(city);

            if (!searchHistory.includes(city)) {
                searchHistory.push(city);
                if (searchHistory.length > 5) searchHistory.shift();
                localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
                updateSearchHistory();
            }

        } catch (error) {
            weatherInfo.html("<p style='color:red;'>City not found. Try again.</p>");
            forecastInfo.html(""); 
        }
    }, 500);

    const fetchForecast = async (city) => {
        const unit = isMetric ? "metric" : "imperial";
        const tempUnit = isMetric ? "°C" : "°F";

        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`);
            const forecastData = response.data.list;

            let dailyForecasts = {};

            forecastData.forEach(entry => {
                let date = entry.dt_txt.split(" ")[0]; 
                if (!dailyForecasts[date] && entry.dt_txt.includes("12:00:00")) {
                    dailyForecasts[date] = entry;
                }
            });

            let forecastHTML = `<h2>5-Day Forecast</h2><div class="forecast-container">`;

            Object.values(dailyForecasts).forEach(day => {
                forecastHTML += `
                    <div class="forecast-card">
                        <p><strong>${new Date(day.dt_txt).toLocaleDateString()}</strong></p>
                        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                        <p>${day.main.temp} ${tempUnit}</p>
                        <p>${day.weather[0].description}</p>
                    </div>
                `;
            });

            forecastHTML += `</div>`;
            forecastInfo.html(forecastHTML);
        } catch (error) {
            forecastInfo.html("<p style='color:red;'>Unable to fetch forecast.</p>");
        }
    };

    // search button
    $("#searchBtn").click(() => {
        const city = $("#cityInput").val().trim();
        if (city) fetchWeather(city);
    });

    // history button
    searchHistoryEl.on("click", "li", function () {
        fetchWeather($(this).text());
    });

    // choose a favorite city
    favoritesEl.on("click", "li", function () {
        fetchWeather($(this).text());
    });

    // add a favorite city
    weatherInfo.on("click", ".fav-btn", function () {
        let city = $(this).data("city");

        if (!favoriteCities.includes(city)) {
            favoriteCities.push(city);
            localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));
            updateFavorites();
        }
    });

    // remove city from favorites
    favoritesEl.on("click", ".remove-fav", function (e) {
        e.stopPropagation(); 
        let city = $(this).data("city");

        favoriteCities = favoriteCities.filter(fav => fav !== city);
        localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));
        updateFavorites();
    });

    
    function updateSearchHistory() {
        searchHistoryEl.html("");
        searchHistory.forEach(city => {
            searchHistoryEl.append(`<li>${city}</li>`);
        });
    }

    
    function updateFavorites() {
        favoritesEl.html("");
        favoriteCities.forEach(city => {
            favoritesEl.append(`<li>${city} <button class="remove-fav" data-city="${city}">❌</button></li>`);
        });
    }

 
    unitToggleBtn.click(() => {
        isMetric = !isMetric; 
        unitToggleBtn.text(`Switch to ${isMetric ? "Imperial" : "Metric"}`);

        if (currentCity) {
            fetchWeather(currentCity);
        }
    });
});
