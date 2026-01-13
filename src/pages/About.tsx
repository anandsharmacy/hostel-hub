import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import nmimsLogo from '@/assets/nmims-logo.png';
import boys1 from '@/assets/hostel/boys1.jpg';
import boys2 from '@/assets/hostel/boys2.jpg';
import boys3 from '@/assets/hostel/boys3.jpg';
import boys4 from '@/assets/hostel/boys4.jpg';
import girls1 from '@/assets/hostel/girls1.jpg';
import girls2 from '@/assets/hostel/girls2.jpg';
import girls3 from '@/assets/hostel/girls3.jpg';
import girls4 from '@/assets/hostel/girls4.jpg';

const hostelImages = [
  { src: boys1, alt: 'Boys Hostel Building' },
  { src: boys2, alt: 'Boys Hostel Room' },
  { src: boys3, alt: 'Boys Hostel Common Area' },
  { src: boys4, alt: 'Auditorium' },
  { src: girls1, alt: 'Girls Hostel Building' },
  { src: girls2, alt: 'Girls Hostel Room' },
  { src: girls3, alt: 'Girls Hostel Common Area' },
  { src: girls4, alt: 'Girls Hostel Facilities' },
];

export default function About() {
  const navigate = useNavigate();

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
      <main className="flex-1">
        {/* About Section */}
        <section className="geometric-bg py-12">
          <div className="container mx-auto px-4">
            <Card className="bg-white/95 backdrop-blur border-0 shadow-xl">
              <CardContent className="pt-8 pb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-nmims-maroon text-center mb-8">
                  About Us
                </h1>
                
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-nmims-maroon/10 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-nmims-maroon" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      NMIMS (Narsee Monjee Institute of Management Studies) is a prestigious university known for its excellence in education. Established in 1981, NMIMS has consistently ranked among the top management and engineering institutions in India. With a strong commitment to providing quality education, NMIMS has become a preferred choice for students seeking to excel in various fields.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-nmims-maroon/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-nmims-maroon" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Our university offers a wide range of programs, including management, engineering, arts, science, and more. We take pride in our world-class faculty, state-of-the-art facilities, and a vibrant campus life that fosters holistic development among students.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-nmims-maroon/10 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-nmims-maroon" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      At NMIMS, we are dedicated to nurturing talent, promoting innovation, and producing leaders who can make a positive impact on society. Explore our website to learn more about the programs we offer and the opportunities that await you at NMIMS.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Hostel Life Section */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-nmims-maroon text-center mb-8">
              Hostel Life
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hostelImages.map((image, idx) => (
                <div 
                  key={idx} 
                  className="group relative overflow-hidden rounded-xl shadow-lg aspect-[4/3]"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm font-medium">{image.alt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Facilities Highlights */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold text-nmims-maroon text-center mb-8">
              Campus Facilities
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: 'AC Rooms', icon: '❄️' },
                { label: 'WiFi Campus', icon: '📶' },
                { label: 'Gym', icon: '💪' },
                { label: '24/7 Security', icon: '🔒' },
                { label: 'Mess & Dining', icon: '🍽️' },
                { label: 'Dispensary', icon: '🏥' },
                { label: 'TV Lounge', icon: '📺' },
                { label: 'Sports Room', icon: '🎮' },
              ].map((facility, idx) => (
                <div 
                  key={idx}
                  className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg border hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl">{facility.icon}</span>
                  <span className="text-sm font-medium text-center">{facility.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-3 text-center text-sm">
        <p>2026 © NMIMS Hyderabad - All rights reserved.</p>
      </footer>
    </div>
  );
}
