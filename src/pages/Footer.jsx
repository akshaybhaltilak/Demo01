import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Linkedin, ArrowRight, ChevronUp } from 'lucide-react';

export default function VastushobhaFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200">
      {/* Top Section with Company Info */}
      <div className="container mx-auto px-6 pt-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-gray-900 font-bold text-xl">A</span>
              </div>
              <h3 className="text-xl font-bold text-white">Akshay</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Building dreams into reality with quality craftsmanship and innovative designs since 1995.
            </p>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="bg-gray-700 hover:bg-yellow-500 p-2 rounded-full transition duration-300 text-white hover:text-gray-900">
                <Facebook size={18} />
              </a>
              <a href="#" className="bg-gray-700 hover:bg-yellow-500 p-2 rounded-full transition duration-300 text-white hover:text-gray-900">
                <Twitter size={18} />
              </a>
              <a href="#" className="bg-gray-700 hover:bg-yellow-500 p-2 rounded-full transition duration-300 text-white hover:text-gray-900">
                <Instagram size={18} />
              </a>
              <a href="#" className="bg-gray-700 hover:bg-yellow-500 p-2 rounded-full transition duration-300 text-white hover:text-gray-900">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          
          {/* Services */}
          
          {/* Newsletter */}
          
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pb-6 border-b border-gray-700">
          <div className="flex items-start">
            <div className="bg-yellow-500 p-2 rounded-lg mr-4">
              <MapPin size={20} className="text-gray-900" />
            </div>
            <div>
              <h5 className="font-bold text-white">Our Location</h5>
              <p className="text-gray-400">123 Construction Avenue, City, State 12345</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-yellow-500 p-2 rounded-lg mr-4">
              <Phone size={20} className="text-gray-900" />
            </div>
            <div>
              <h5 className="font-bold text-white">Call Us</h5>
              <p className="text-gray-400">+1 (123) 456-7890</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-yellow-500 p-2 rounded-lg mr-4">
              <Mail size={20} className="text-gray-900" />
            </div>
            <div>
              <h5 className="font-bold text-white">Email Us</h5>
              <p className="text-gray-400">info@akshay.com</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-yellow-500 p-2 rounded-lg mr-4">
              <Clock size={20} className="text-gray-900" />
            </div>
            <div>
              <h5 className="font-bold text-white">Working Hours</h5>
              <p className="text-gray-400">Mon-Sat: 9AM - 6PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-gray-950 py-4">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Akshay Construction. All Rights Reserved.
          </p>
          <div className="flex mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-yellow-500 text-sm mx-2">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-yellow-500 text-sm mx-2">Terms & Conditions</a>
            <a href="#" className="text-gray-400 hover:text-yellow-500 text-sm mx-2">Sitemap</a>
          </div>
          <button 
            onClick={scrollToTop}
            className="bg-yellow-500 text-gray-900 p-2 rounded-full hover:bg-yellow-600 transition duration-300 mt-4 md:mt-0"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
}