import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark-gray text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Contacts Column */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Контакты</h3>
            <div className="space-y-3 font-body">
              <a href="tel:+74951234567" className="flex items-center space-x-3 hover:text-primary transition-colors">
                <Phone size={18} />
                <span>+7 (495) 123-45-67</span>
              </a>
              <a href="mailto:info@elevategifts.ru" className="flex items-center space-x-3 hover:text-primary transition-colors">
                <Mail size={18} />
                <span>info@elevategifts.ru</span>
              </a>
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="mt-1" />
                <span>Москва, ул. Примерная, д. 123</span>
              </div>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Навигация</h3>
            <nav className="flex flex-col space-y-2 font-body">
              <a href="#catalog" className="hover:text-primary transition-colors">
                Каталог
              </a>
              <a href="#portfolio" className="hover:text-primary transition-colors">
                Портфолио
              </a>
              <a href="#eco" className="hover:text-primary transition-colors">
                Эко-серия
              </a>
              <a href="#contacts" className="hover:text-primary transition-colors">
                Контакты
              </a>
            </nav>
          </div>

          {/* Social Media Column */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Социальные сети</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook size={24} />
              </a>
              <a href="#" className="hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram size={24} />
              </a>
              <a href="#" className="hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="font-body text-gray-400 text-sm">
            © 2025 ELEVATE GIFTS. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}

