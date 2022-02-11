import fetch from 'node-fetch';

export interface Location {
  lon: string;
  lat: string;
}

interface ApiResults {
  sunrise: string;
  sunset: string;
  civil_twilight_begin: string;
  civil_twilight_end: string;
  nautical_twilight_begin: string;
  nautical_twilight_end: string;
  astronomical_twilight_begin: string;
  astronomical_twilight_end: string;
}

interface ApiResponse {
  results: ApiResults;
}

const fetchSunriseSunset = async (location: Location) => {
  const { lon, lat } = location;
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=today&formatted=0`;

  return fetch(url)
    .then((res) => res.json())
    .then((data) => data as ApiResponse);
};

export const fetchSunrise = async (location: Location) => {
  return fetchSunriseSunset(location).then((data) => data.results.sunrise);
};

export const fetchSunset = async (location: Location) => {
  return fetchSunriseSunset(location).then((data) => data.results.sunset);
};
