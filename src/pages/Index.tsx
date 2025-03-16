
import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation2, Wind, Sun, Moon, CloudRain, Leaf } from 'lucide-react';
import { generateRoute } from '@/lib/route-utils';
import { useToast } from '@/hooks/use-toast';
import RouteMap from '@/components/RouteMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const activities = [
  {
    id: 'walking',
    title: 'Walking',
    icon: '🚶‍♂️',
    description: 'Clear your mind with a peaceful walk',
    bgClass: 'from-green-50 to-green-100',
    iconBg: 'bg-green-200',
    benefits: ['Reduces stress', 'Improves mood', 'Promotes creativity'],
  },
  {
    id: 'running',
    title: 'Running',
    icon: '🏃‍♂️',
    description: 'Boost your energy and mood',
    bgClass: 'from-blue-50 to-blue-100',
    iconBg: 'bg-blue-200',
    benefits: ['Increases endorphins', 'Improves cardiovascular health', 'Burns calories'],
  },
  {
    id: 'cycling',
    title: 'Cycling',
    icon: '🚴‍♂️',
    description: 'Explore and energize yourself',
    bgClass: 'from-purple-50 to-purple-100',
    iconBg: 'bg-purple-200',
    benefits: ['Low-impact exercise', 'Strengthens leg muscles', 'Improves balance'],
  },
  {
    id: 'driving',
    title: 'Driving',
    icon: '🚗',
    description: 'Take a mindful scenic drive',
    bgClass: 'from-amber-50 to-amber-100',
    iconBg: 'bg-amber-200',
    benefits: ['Discover new places', 'Time for reflection', 'Change of scenery'],
  },
];

const Index = () => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [duration, setDuration] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('activities');
  const [currentTime, setCurrentTime] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleGenerateRoute = async () => {
    if (!selectedActivity) {
      toast({
        title: "Select an activity",
        description: "Please select an activity before generating a route",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setLoadingProgress(0);
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation([coords.latitude, coords.longitude]);
            
            const route = await generateRoute(
              coords,
              Number(duration),
              selectedActivity
            );
            
            setRouteData(route);
            setLoadingProgress(100);
            setTimeout(() => setCurrentTab('route'), 500);
            
            toast({
              title: "Route generated!",
              description: "Your route has been successfully created.",
            });
          } catch (error) {
            setLoadingProgress(100);
            toast({
              title: "Error",
              description: "Failed to generate route. Please try again.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          setLoadingProgress(100);
          toast({
            title: "Location access denied",
            description: "Please enable location access to generate routes",
            variant: "destructive",
          });
        }
      );
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        clearInterval(progressInterval);
      }, 1000);
    }
  };

  const getRandomWeatherIcon = () => {
    const icons = [<Sun className="text-amber-400" />, <CloudRain className="text-blue-400" />, <Wind className="text-slate-400" />];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
      <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        <header className="text-center mb-10">
          <div className="inline-block p-2 bg-primary/10 rounded-full mb-3 animate-pulse-soft">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-3 decorated-heading font-display">Clarity</h1>
          <p className="text-gray-600 max-w-md mx-auto">Discover mindful routes that bring peace and tranquility to your day</p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="glass-panel py-2 px-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{currentTime}</span>
            </div>
            <div className="glass-panel py-2 px-4 flex items-center gap-2">
              {getRandomWeatherIcon()}
              <span>22°C</span>
            </div>
          </div>
        </header>

        <Tabs 
          defaultValue="activities" 
          value={currentTab} 
          onValueChange={setCurrentTab}
          className="animate-scale-in"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="activities">Choose Activity</TabsTrigger>
            <TabsTrigger value="route" disabled={!routeData}>View Route</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activities" className="space-y-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-6 font-display">Choose Your Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {activities.map((activity) => (
                  <Card
                    key={activity.id}
                    className={`activity-card border-0 overflow-hidden bg-gradient-to-br ${activity.bgClass} ${
                      selectedActivity === activity.id
                        ? 'ring-2 ring-primary shadow-glow'
                        : ''
                    }`}
                    onClick={() => setSelectedActivity(activity.id)}
                  >
                    <div className="absolute top-2 right-2">
                      {selectedActivity === activity.id && (
                        <Badge variant="default" className="bg-primary/80 animate-pulse-soft">Selected</Badge>
                      )}
                    </div>
                    <div className={`w-16 h-16 rounded-full ${activity.iconBg} flex items-center justify-center mb-4 text-3xl`}>
                      {activity.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
                    <p className="text-gray-600 mb-4">{activity.description}</p>
                    <div className="space-y-1 mt-2">
                      {activity.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mr-2"></div>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {selectedActivity && (
              <section className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-semibold mb-6 font-display">Route Details</h2>
                <Card className="glass-panel overflow-hidden border-0">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center space-x-4 glass-panel p-3 rounded-lg">
                      <MapPin className="text-primary" />
                      <input
                        type="text"
                        placeholder="Current location"
                        className="input-field flex-1 border-0 shadow-inner-glow bg-transparent"
                        defaultValue="Using current location"
                        disabled
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-600">Duration (minutes)</label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="5"
                          max="180"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-secondary/50"
                        />
                        <span className="w-14 text-center px-2 py-1 bg-primary/10 rounded-md font-medium">
                          {duration}
                        </span>
                      </div>
                    </div>

                    <Button 
                      className="w-full btn-primary relative overflow-hidden group"
                      onClick={handleGenerateRoute}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="absolute inset-0 w-full">
                            <Progress value={loadingProgress} className="h-full rounded-lg bg-primary/30" />
                          </div>
                          <span className="relative z-10 flex items-center gap-2">
                            <span className="animate-pulse">Generating route...</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <Navigation2 className="w-5 h-5 group-hover:animate-float" />
                          <span>Generate Route</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}
          </TabsContent>
          
          <TabsContent value="route" className="space-y-6">
            {userLocation && routeData && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold font-display">Your Route</h2>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('activities')}
                    className="text-sm"
                  >
                    Back to Activities
                  </Button>
                </div>
                
                <Card className="glass-panel border-0 overflow-hidden shadow-card mb-6">
                  <CardContent className="p-0">
                    <div className="h-[400px] md:h-[500px] w-full rounded-lg overflow-hidden relative">
                      <RouteMap route={routeData} center={userLocation} />
                      <div className="absolute bottom-4 right-4 glass-panel py-2 px-4 flex items-center gap-2 text-sm">
                        <Navigation2 className="w-4 h-4 text-primary" />
                        <span>{((routeData.distance || 0) / 1000).toFixed(1)} km</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="glass-panel border-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimated Time</p>
                        <p className="font-medium">{Math.round((routeData.duration || 0) / 60)} minutes</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-panel border-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Distance</p>
                        <p className="font-medium">{((routeData.distance || 0) / 1000).toFixed(1)} kilometers</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-panel border-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Difficulty</p>
                        <p className="font-medium">Moderate</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <footer className="mt-12 text-center text-gray-500 py-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <p className="mb-2">Take a moment to breathe and connect with your surroundings</p>
          <div className="flex justify-center gap-2 text-primary/60">
            <Moon className="w-4 h-4" />
            <Sun className="w-4 h-4" />
            <Wind className="w-4 h-4" />
            <Leaf className="w-4 h-4" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
