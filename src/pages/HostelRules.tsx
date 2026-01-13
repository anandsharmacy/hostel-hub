import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, BookOpen, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import nmimsLogo from '@/assets/nmims-logo.png';

const hostelRules = [
  "Admission is open to full time students of SVKM'S NMIMS.",
  "The hostel application form need to be submitted through Hostel Application Portal.",
  "Admission to the Hostel will be cancelled if incomplete or false information is furnished.",
  "Applicants offered admission in the Hostel will be informed by letter/email or their names will be put up on our website (3 days prior to start the course). They will have to take up the accommodation by the stipulated date, failing which his/her admission will be cancelled.",
  "Admission will be valid for one academic year only (10 months from the date of commencement of course).",
  "Students will be required to vacate the room within 3 days on completion of the scheduled examination each year, subject to adjustment of examination dates fixed by the appropriate Authority of NMIMS.",
  "Students are allowed to stay in the Hostel during the winter / summer vacations by paying proportionate extra fees.",
  "Fresh application will have to be filled up for next year accommodation.",
  "Students are required to give their consent about continuing the Hostel facilities in the next year, when asked by the authorities.",
  "Hostel fee for the next academic year is required to be paid in the month of February to April.",
  "NMIMS reserves its right to cancel admission of undeserving students without giving any reason.",
  "NMIMS reserves its right to increase the hostel fee, if necessary.",
  "NMIMS will not be responsible for any mishap.",
  "Student residing in the Hostel managed by SVKM's NMIMS shall strictly observe all the Rules and Regulations in force from time to time. Breach of rules / regulations may invite rustication / fine.",
  "During their stay in the Hostel, they will be under the control of the Officials of NMIMS / Rector.",
  "Smoking, consumption of alcoholic drinks, drugs and spitting is strictly prohibited in the hostel premises. Strict action will be taken against defaulter (as per rule).",
  "No guest or visitor of the inmate will be permitted to visit rooms. Visitors and guests should be received in the Visitors room or Reception area only between 9.00 a.m. to 9.00 p.m.",
  "Every student shall be in his / her hostel by 10.30 p.m. If he / she has to stay out after the said timing owing to any special reason, he / she must obtain prior permission from the Registrar / Rector. Late entry without prior permission will invite penalty / rustication. 'Night out' is allowed only to visit local guardian or relatives staying in Hyderabad. A maximum of 8 'Night outs' will be allowed in a month. The students who are taking night outs are not allowed to enter the hostel after 8 pm on the respective day till next day morning 7 am.",
  "No students shall use the service of a hostel servant for personal work even on payment. He/she shall also not bring any servant from outside even temporarily.",
  "Students will not enter rooms of other students without permission of the inmates. Students should not go to other Students flat after 8.00 p.m. in the night.",
  "Every case of illness and accident must be reported immediately to the Warden/Rector/Administrative Officer/Assistant Registrar.",
  "No functions or celebrations shall be organized except with the permission of the Deputy Registrar.",
  "Resident students are not permitted to convene any meeting of any sort under any circumstances anywhere in the Hostel premises without the prior permission of the Rector/Administrative Officer.",
  "No poster etc. should be put up anywhere, either in rooms or lobbies.",
  "Students are not allowed to play any kind of sports in the room.",
  "Throwing of water, colour etc. on one another and on the walls / property of the hostel is strictly prohibited.",
  "Students suffering from any contagious disease will not be allowed to stay in the hostel. Decision of the Management in this regard will be final and binding.",
  "Allotment of the room, furniture etc. will be entirely at the discretion of the Rector/Administrative Officer and no complaint in this regard will be entertained.",
  "Every student shall keep the room allotted to him clean and neat. He / She shall take proper care of the furniture and fixtures handed over to him / her. The hostel authorities have the right to enter and inspect the rooms at any time, even in the absence of students.",
  "All matters relating to differences among students and complaints about the hostel servants shall be brought to the notice of the Rector/Administrative Officer/Deputy Registrar, who will take such action as may be necessary. No police complaint will be lodged by the students before taking prior permission from the Deputy Registrar.",
  "Students are expected to switch off the lights and fans in their rooms every time they go out and take precautions to economize electricity consumption.",
  "Charges for any damages to the property as well as to the furniture and fixtures caused by a student/students' negligence will be recovered from the student/students staying in the said flat / room.",
  "Student should not drive nails, screws etc. into the wall or doors. No repair shall be done by the students themselves. They should approach the Rector/Administrative Officer who will arrange for repairs.",
  "Hostel is meant only for the use of bonafide students of that particular hostel. Visitors are not allowed to enter any room.",
  "The Hostel Authorities did not hold themselves responsible for the safe custody of the property of the students staying in the hostel. Students should provide their own locks and should take proper care of their belongings. NMIMS will not be responsible for the loss of personal belongings of the students.",
  "All the facilities including additional facilities like T.V. Room, Gym, Game Room, Sick bay, Saloon, Newspaper, Internet etc., misused, shall be discontinued without given any notice and disciplinary action will be taken against the students involved.",
  "Before leaving the hostel, a student must pay all dues and hand over the charges of rooms and other material in satisfactory condition to the Rector/Administrative Officer.",
  "If any student is found misbehaving and misconducting himself, he/she will be expelled from the hostel immediately and the fees paid by him / her will be forfeited.",
  "Permission must be sought and obtained, if night outs (only for local guardian and parent's house) are desired from hostel in charge, 1 day in advance.",
  "No music system is allowed in hostel / flats.",
  "Any complaint (indecent behaviour/noisy) from the neighbours/society will result in severe action.",
  "Hostel is required to be vacated with luggage in every summer vacation.",
  "Students are provided with some add on facilities (tentative) like Fridge / TV / Wi-Fi connection / Micro Oven / Water Dispenser / Single Bed / Cupboard / Chair etc. Cleaning staff / Security services are provided at every location.",
  "Ragging is strictly prohibited inside the hostel premises.",
  "The students have to apply leave in prescribed form one day in advance, stating the reason for leaving and the address of destination and have to take approval from hostel authorities.",
  "The hostel authorities or their representatives may enter any room for verification at any time of the day or night in the presence of the student.",
  "Playing Holi and celebrating Diwali inside the hostel premises is strictly prohibited. Disciplinary action will be taken against any student found guilty of violating this rule.",
  "In case the students go for tours/picnics organized by Private groups or unofficially on their own, NMIMS will not bear responsibility for any mishap and the students will have to go at their risk.",
  "In and out time entry should be made in register properly.",
  "The allotment of rooms is random basis. Therefore, there is no provision for choosing a hostel roommate.",
  "There is no provision for prior reservation of hostel rooms for students or their parents.",
  "The student may occupy the room immediately after allotment.",
  "Refund of Hostel fee is allowed only in the case of cancellation of admission from NMIMS. If the cancellation is made before start of class, Rs. 3000/- as processing charges will be deducted. After start of class there will be no refund.",
];

const faqs = [
  {
    question: "What is the Hostel Fees?",
    answer: "Please visit NMIMS Hostel Application Portal https://portal.svkm.ac.in/usermgmt/viewHostels"
  },
  {
    question: "Is the Mess Charges included in the hostel fees?",
    answer: "YES, it includes Breakfast, Lunch, Evening Snacks & Dinner."
  },
  {
    question: "Is internet facility available in hostels?",
    answer: "YES, WIFI enabled campus including hostels."
  },
  {
    question: "What are the other facilities available in hostels?",
    answer: "Separate Girls and Boys hostels have Gym, Dispensary, all AC rooms, Geysers for hot water, TV Lounge rooms, Reading Room Areas, Sports Room, Dining & Kitchen, paid basis Grocery, Laundry and Parlour are also available."
  },
  {
    question: "How many students share one room?",
    answer: "04 sharing AC rooms. Separate Beds, Mattresses, Pillows, Bedsheets, Pillow covers and Quilts, Buckets and Mugs are provided to all hostellers."
  },
  {
    question: "Can students/parents visit the hostel before admission?",
    answer: "YES, only in Ground Floors of G+7 buildings."
  },
  {
    question: "What if the hostel rooms are not available till the time the students pay the course fees?",
    answer: "Such situation does not occur, as Hostel is Compulsory for all Students."
  },
  {
    question: "What is the hostel cancellation policy?",
    answer: "If a student cancels his/her admission from NMIMS (before commencement of class), then only they can cancel the hostel accommodation. Kindly refer the cancellation rules on hostel application portal."
  },
  {
    question: "How far is the hostel from the College Campus?",
    answer: "200 m (Girls); 300 m (Boys) from Academic Building. Hostels are in the campus."
  },
  {
    question: "Is there any transportation facility from university side?",
    answer: "Yes, only for the inside campus, the electric vehicle is available as a transport facility during college times."
  },
];

export default function HostelRules() {
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-nmims-maroon mb-2">
          Hostel Rules & Regulations
        </h1>
        <p className="text-muted-foreground mb-8">
          Rules and discipline for admission in hostel - Jadcherla Residential Campus
        </p>

        <div className="grid gap-6">
          {/* Rules Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                Rules for Hostel Admission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {hostelRules.map((rule, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-7 h-7 bg-nmims-maroon/10 text-nmims-maroon rounded-full flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="pt-1 text-muted-foreground leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">
                      {idx + 1}. {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
