import React, { useState, useEffect } from 'react'
import {
  Search,
  Link as LinkIcon,
  ChevronDown,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Cloud,
  MapPin,
  AlertCircle,
  File,
  FileText,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { Weather } from '@/components/_components/_tools/weather/weather'
import { GoogleDrive } from '@/components/_components/_tools/google-drive/google-drive'
import { Button } from '@/components/ui/button'

const ToolCallDisplay = ({ toolCalls }: { toolCalls: any[] }) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [locationWeatherData, setLocationWeatherData] = useState<any>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  if (!toolCalls || toolCalls.length === 0) {
    return null
  }

  const hasResults = toolCalls.some((call) => call.result && call.result.results && call.result.results.length > 0)

  const handleGetCurrentLocation = (toolCallId: string) => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
          )

          if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`)
          }

          const weatherData = await response.json()
          setLocationWeatherData({ toolCallId, data: weatherData })
          setIsLoadingLocation(false)
        } catch (error) {
          console.error('Error fetching weather data:', error)
          setLocationError('Failed to fetch weather data')
          setIsLoadingLocation(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        setLocationError(
          error.code === 1
            ? 'Location permission denied. Please allow location access to see your local weather.'
            : 'Unable to determine your location'
        )
        setIsLoadingLocation(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {toolCalls.map((call) => (
        <div
          key={call.toolCallId}
          className={cn(
            call.toolName !== 'generateImage' && 
            call.toolName !== 'getWeather' && 
            call.toolName !== 'searchGoogleDrive' && 
            call.toolName !== 'readGoogleDriveFile' && 
            'p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10'
          )}
        >
          {call.toolName === 'search' && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                  {call.result ? <Search className="w-4 h-4" /> : <Spinner className="w-4 h-4 animate-spin" />}
                  <span>
                    {call.result ? 'Searched the web for:' : 'Searching the web for:'} <em>"{call.args.query}"</em>
                  </span>
                </div>
                {hasResults && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80"
                  >
                    <span>{isCollapsed ? 'Show' : 'Hide'} Results</span>
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', !isCollapsed && 'rotate-180')} />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {!isCollapsed && call.result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {call.result.answer && (
                      <div className="text-sm p-3 mt-2 rounded-md bg-black/5 dark:bg-white/5">
                        <strong>Answer:</strong> {call.result.answer}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {call.result.results.map((item: any, index: number) => (
                        <a
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/30 transition-colors shadow-sm border border-black/5 dark:border-white/5"
                        >
                          <div className="font-semibold text-sm text-rose-600 dark:text-rose-400 truncate">
                            {item.title}
                          </div>
                          <p className="text-xs text-black/70 dark:text-white/70 mt-1 line-clamp-2">{item.content}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <LinkIcon className="w-3 h-3 text-black/40 dark:text-white/40" />
                            <span className="text-xs text-black/50 dark:text-white/50 truncate">{item.url}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {call.toolName === 'getWeather' && (
            <div>
              <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                <Cloud className="w-4 h-4" />
                <span>
                  {call.result && !call.result.needsLocation
                    ? `Weather for coordinates: ${call.args.latitude?.toFixed(2)}, ${call.args.longitude?.toFixed(2)}`
                    : call.args.useCurrentLocation
                    ? 'Weather for your current location'
                    : `Weather for coordinates: ${call.args.latitude?.toFixed(2)}, ${call.args.longitude?.toFixed(2)}`}
                </span>
              </div>

              {/* Handle current location request */}
              {call.result && call.result.needsLocation && (
                <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  {!locationWeatherData || locationWeatherData.toolCallId !== call.toolCallId ? (
                    <>
                      {!isLoadingLocation && !locationError && (
                        <div className="flex flex-col items-center gap-3 py-2">
                          <MapPin className="w-8 h-8 text-primary" />
                          <p className="text-sm text-center">Allow access to your location to see your local weather</p>
                          <Button 
                            onClick={() => handleGetCurrentLocation(call.toolCallId)}
                            className="mt-1"
                            size="sm"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Share my location
                          </Button>
                        </div>
                      )}

                      {isLoadingLocation && (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <Spinner className="w-6 h-6 animate-spin text-primary" />
                          <p className="text-sm">Getting your location...</p>
                        </div>
                      )}

                      {locationError && (
                        <div className="flex flex-col items-center gap-3 py-2">
                          <AlertCircle className="w-6 h-6 text-destructive" />
                          <p className="text-sm text-center text-destructive">{locationError}</p>
                          <Button 
                            onClick={() => handleGetCurrentLocation(call.toolCallId)}
                            variant="outline"
                            size="sm"
                            className="mt-1"
                          >
                            Try again
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Weather weatherAtLocation={locationWeatherData.data} />
                  )}
                </div>
              )}

              {/* Display weather data if it's already available */}
              {call.result && !call.result.needsLocation && <Weather weatherAtLocation={call.result} />}
            </div>
          )}

          {/* Google Drive Search Tool */}
          {call.toolName === 'searchGoogleDrive' && (
            <div>
              <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                <File className="w-4 h-4" />
                <span>
                  {call.result ? 'Searched Google Drive for:' : 'Searching Google Drive for:'}{' '}
                  <em>"{call.args.query || 'all files'}"</em>
                </span>
              </div>
              <GoogleDrive searchRequest={{ 
                type: 'search', 
                query: call.args.query || '', 
                limit: call.args.limit || 10 
              }} />
            </div>
          )}

          {/* Google Drive Read File Tool */}
          {call.toolName === 'readGoogleDriveFile' && (
            <div>
              <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                <FileText className="w-4 h-4" />
                <span>
                  {call.result ? 'Reading file from Google Drive:' : 'Reading file from Google Drive:'}{' '}
                  <em>"{call.args.fileId}"</em>
                </span>
              </div>
              <GoogleDrive readRequest={{ 
                type: 'read', 
                fileId: call.args.fileId 
              }} />
            </div>
          )}

          {call.toolName === 'generateImage' && (
            <div>
              <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                <ImageIcon className="w-4 h-4" />
                <span>{call.result ? 'Generated image:' : 'Generating image...'}</span>
              </div>
              {call.result ? (
                <div className="mt-2 relative group">
                  <img
                    src={call.result.url || call.result}
                    alt={call.args.prompt}
                    className="rounded-lg max-w-full max-h-[512px] object-contain bg-black/5 dark:bg-white/5"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={call.result.url || call.result}
                      download="generated-image.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-lg">
                  <Spinner className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ToolCallDisplay
