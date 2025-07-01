import { tool } from 'ai';
import { z } from 'zod';

export const getWeather = tool({
  description: 'Get the current weather at a location. Set useCurrentLocation to true to get weather at user\'s location.',
  parameters: z.object({
    latitude: z.number().optional().describe("The latitude coordinate of the location (not needed if useCurrentLocation is true)"),
    longitude: z.number().optional().describe("The longitude coordinate of the location (not needed if useCurrentLocation is true)"),
    useCurrentLocation: z.boolean().optional().describe("Set to true to use the user's current location instead of providing coordinates")
  }),
  execute: async (args) => {
    try {
      // Handle current location request
      if (args.useCurrentLocation) {
        return {
          needsLocation: true,
          message: 'Requesting user location permission...'
        };
      }
      
      // Use provided coordinates
      const { latitude, longitude } = args;
      
      if (latitude === undefined || longitude === undefined) {
        throw new Error("Latitude and longitude are required when not using current location");
      }
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const weatherData = await response.json();
      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error);
      return {
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});