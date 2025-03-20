import React from 'react';
import { Share2, Heart, MessageCircle, Award, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Route } from '@/store/route-store';

interface SocialShareProps {
  route: Route;
  onShare?: () => void;
}

export function SocialShare({ route, onShare }: SocialShareProps) {
  const [reflection, setReflection] = React.useState('');
  const [isSharing, setIsSharing] = React.useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Generate route snapshot
      const snapshot = await generateRouteSnapshot(route);
      
      // Share to social media
      if (navigator.share) {
        await navigator.share({
          title: 'My Mindful Route',
          text: reflection || 'Check out this mindful route I discovered!',
          url: snapshot.url
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await copyToClipboard(snapshot.url);
        toast({
          title: 'Link Copied!',
          description: 'Share the link with your friends.',
        });
      }
      
      onShare?.();
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Sharing Failed',
        description: 'Unable to share the route. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const generateRouteSnapshot = async (route: Route) => {
    // Generate a shareable snapshot of the route
    // This would typically:
    // 1. Create a static image of the route
    // 2. Upload to your server
    // 3. Return a shareable URL
    
    // Placeholder implementation
    return {
      url: `https://yourapp.com/routes/${route.id}`,
      image: 'route-snapshot.png'
    };
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12 fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm shadow-lg"
        >
          <Share2 className="h-6 w-6" />
          <span className="sr-only">Share Route</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Mindful Journey</DialogTitle>
          <DialogDescription>
            Share your route and inspire others on their mindful journey.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Add a reflection about your journey..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Camera className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Award className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={handleShare} disabled={isSharing}>
              {isSharing ? 'Sharing...' : 'Share Route'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Route details:
            <ul className="list-disc list-inside mt-2">
              <li>Distance: {route.distance.toFixed(2)} km</li>
              <li>Duration: {(route.duration / 60).toFixed(0)} minutes</li>
              <li>Elevation gain: {route.elevation.toFixed(0)}m</li>
              <li>Activity: {route.activity}</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
