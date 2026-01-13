import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Ambulance, Building2, Shield, Car, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import nmimsLogo from '@/assets/nmims-logo.png';

const contactDetails = [
  { name: 'Chanakya.ND', position: 'Rector', phone: '8463917030' },
  { name: 'Savitha.U', position: 'Warden Girls Hostel', phone: '8125204909 / 6281306160' },
  { name: 'Ajay Kumar.J', position: 'Warden Boys Hostel', phone: '9642076986' },
];

const ambulanceServices = [
  { name: 'Mallesh', position: 'Nurse Boys Hostel', phone: '9704486383' },
  { name: 'Sunitha', position: 'Nurse Girls Hostel', phone: '9963756049' },
  { name: 'Anjaneyulu', position: 'Ambulance Driver', phone: '8790656478' },
];

const hospitals = [
  { name: 'Agur Prime Hospital', address: '12, Municipality, #12-94-12-99, Block, near Netaji chowk, Badepally, Telangana 509301', phone: '7997992977' },
  { name: 'Amoggh Hospital', address: '1-8/5/A/1, opp LIC Office, Badepally road, Jadcherla, Telangana 509301', phone: '9611199877' },
];

const police = [
  { name: 'Jadcherla Local Police', phone: '8712659314' },
];

const drivers = [
  { name: 'Mallesh', phone: '9542308367' },
  { name: 'B Lata', phone: '7036258367' },
];

const localTransport = [
  { name: 'Farukh (Auto Driver)', note: 'Paid basis', phone: '9666727861' },
  { name: 'Yadagiri (Auto Driver)', note: 'Paid basis', phone: '9652536527' },
  { name: 'Sudarshan (Auto Driver)', note: 'Paid basis', phone: '9515871127' },
  { name: 'Ramu Travels (Cab)', note: 'Paid basis', phone: '9912693357 / 9100188093' },
];

export default function Contact() {
  const navigate = useNavigate();

  const handleCall = (phone: string) => {
    // Get the first phone number if multiple are provided
    const primaryPhone = phone.split('/')[0].trim().replace(/\s/g, '');
    window.open(`tel:${primaryPhone}`, '_self');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="nmims-header text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <img 
                src={nmimsLogo} 
                alt="NMIMS Logo" 
                className="h-8 w-auto brightness-0 invert"
              />
              <span className="hidden sm:block text-sm font-medium">NMIMS Hyderabad</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-nmims-maroon mb-8">
          Emergency Contacts
        </h1>

        <div className="grid gap-6">
          {/* Hostel Administration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                Hostel Administration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {contactDetails.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.position}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCall(contact.phone)}
                      className="shrink-0"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {contact.phone.split('/')[0].trim()}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ambulance Services */}
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <Ambulance className="h-5 w-5" />
                Ambulance Services 24x7
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {ambulanceServices.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.position}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCall(contact.phone)}
                      className="shrink-0"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {contact.phone}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hospitals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Nearby Hospitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {hospitals.map((hospital, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium">{hospital.name}</p>
                      <p className="text-xs text-muted-foreground">{hospital.address}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCall(hospital.phone)}
                      className="shrink-0 w-full sm:w-auto"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {hospital.phone}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Police */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Police
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {police.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <p className="font-medium">{contact.name}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCall(contact.phone)}
                      className="shrink-0"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {contact.phone}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drivers & Transport */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-primary" />
                Campus Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {drivers.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <p className="font-medium">{contact.name}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCall(contact.phone)}
                      className="shrink-0"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {contact.phone}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Local Transport */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-primary" />
                Local Transport (Paid)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {localTransport.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.note}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCall(contact.phone)}
                      className="shrink-0"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {contact.phone.split('/')[0].trim()}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-3 text-center text-sm">
        <p>2026 © NMIMS Hyderabad - All rights reserved.</p>
      </footer>
    </div>
  );
}
