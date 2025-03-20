import React, { useState } from 'react';
import { AlertCircle, Phone, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface Contact {
  name: string;
  phone: string;
}

export function SafetyControls() {
  const [emergencyContacts, setEmergencyContacts] = useState<Contact[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleAddContact = (contact: Contact) => {
    setEmergencyContacts([...emergencyContacts, contact]);
    toast({
      title: 'Contact added',
      description: `${contact.name} has been added to your emergency contacts.`,
    });
  };

  const handleSOS = () => {
    // Implement SOS functionality
    // This could send SMS, make a call, or trigger other emergency responses
    toast({
      title: 'Emergency Alert Sent',
      description: 'Your emergency contacts have been notified of your location.',
      variant: 'destructive',
    });
  };

  const toggleLocationSharing = () => {
    setIsSharing(!isSharing);
    toast({
      title: isSharing ? 'Location Sharing Stopped' : 'Location Sharing Started',
      description: isSharing
        ? 'Your contacts will no longer receive your location updates.'
        : 'Your emergency contacts will receive your location updates.',
    });
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      <Button
        variant="destructive"
        size="icon"
        onClick={handleSOS}
        className="rounded-full h-12 w-12 shadow-lg"
      >
        <Phone className="h-6 w-6" />
        <span className="sr-only">SOS</span>
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg bg-background/80 backdrop-blur-sm"
          >
            <AlertCircle className="h-6 w-6" />
            <span className="sr-only">Emergency Contacts</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emergency Contacts</DialogTitle>
            <DialogDescription>
              Add emergency contacts who will be notified in case of an emergency.
            </DialogDescription>
          </DialogHeader>
          {/* Add contact form here */}
        </DialogContent>
      </Dialog>

      <Button
        variant={isSharing ? 'default' : 'outline'}
        size="icon"
        onClick={toggleLocationSharing}
        className="rounded-full h-12 w-12 shadow-lg bg-background/80 backdrop-blur-sm"
      >
        <Share2 className="h-6 w-6" />
        <span className="sr-only">Share Location</span>
      </Button>
    </div>
  );
}
