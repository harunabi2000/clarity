import React, { useState } from 'react';
import { MapPin, Clock, Navigation2 } from 'lucide-react';
import { generateRoute } from '@/lib/route-utils';
import { useToast } from '@/components/ui/use-toast';

const activities = [
  {
    id: 'walking',
    title: 'Walking',
    icon: '🚶‍♂️',
    description: 'Clear your mind with a peaceful walk',
  },
  {
    id: 'running',
    title: 'Running',
    icon: '🏃‍♂️',
    description: 'Boost your energy and mood',
  },
  {
    id: 'cycling',
    title: 'Cycling',
    icon: '🚴‍♂️',
    description: 'Explore and energize yourself',
  },
  {
    id: 'driving',
    title: 'Driving',
    icon: '🚗',
    description: 'Take a mindful scenic drive',
  },
];

const Index = () => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [duration, setDuration] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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
    try {
      // Use browser's geolocation API to get current position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const route = await generateRoute(
              {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              Number(duration),
              selectedActivity
            );
            
            toast({
              title: "Route generated!",
              description: "Your route has been successfully created.",
            });
            
            // Here you would typically update state to show the route on a map
            console.log('Generated route:', route);
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to generate route. Please try again.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          toast({
            title: "Location access denied",
            description: "Please enable location access to generate routes",
            variant: "destructive",
          });
        }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Clarity</h1>
        <p className="text-gray-600">Discover routes that bring peace of mind</p>
      </header>

      <div className="max-w-4xl mx-auto">
        <section className="mb-12 animate-scale-in">
          <h2 className="text-2xl font-semibold mb-6">Choose Your Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`activity-card p-6 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  selectedActivity === activity.id
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'bg-white'
                }`}
                onClick={() => setSelectedActivity(activity.id)}
              >
                <div className="text-4xl mb-4">{activity.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
                <p className="text-gray-600">{activity.description}</p>
              </div>
            ))}
          </div>
        </section>

        {selectedActivity && (
          <section className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-6">Route Details</h2>
            <div className="glass-panel rounded-lg p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <MapPin className="text-primary" />
                <input
                  type="text"
                  placeholder="Current location"
                  className="input-field flex-1"
                  defaultValue="Using current location"
                  disabled
                />
              </div>

              <div className="flex items-center space-x-4">
                <Clock className="text-primary" />
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="input-field w-24"
                  min="5"
                  max="180"
                />
                <span className="text-gray-600">minutes</span>
              </div>

              <button 
                className="btn-primary w-full flex items-center justify-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateRoute}
                disabled={isGenerating}
              >
                <Navigation2 className="w-5 h-5" />
                <span>{isGenerating ? 'Generating...' : 'Generate Route'}</span>
              </button>
            </div>
          </section>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-600">
        <p>Take a moment to breathe and connect with your surroundings</p>
      </footer>
    </div>
  );
};

export default Index;