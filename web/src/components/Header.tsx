import { useState } from 'react'
import { Menu, X, Phone } from 'lucide-react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-heading font-bold text-dark-gray">
              ELEVATE GIFTS
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#catalog" className="text-dark-gray hover:text-primary transition-colors font-body font-medium">
              Каталог
            </a>
            <a href="#portfolio" className="text-dark-gray hover:text-primary transition-colors font-body font-medium">
              Портфолио
            </a>
            <a href="#eco" className="text-dark-gray hover:text-primary transition-colors font-body font-medium">
              Эко-серия
            </a>
            <a href="#contacts" className="text-dark-gray hover:text-primary transition-colors font-body font-medium">
              Контакты
            </a>
          </nav>

          {/* Right Side - Phone & CTA */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="tel:+74951234567" className="flex items-center space-x-2 text-dark-gray hover:text-primary transition-colors font-body">
              <Phone size={18} />
              <span className="font-medium">+7 (495) 123-45-67</span>
            </a>
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-body font-semibold hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg">
              Заказать Бриф
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-dark-gray"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <a href="#catalog" className="text-dark-gray hover:text-primary transition-colors font-body font-medium py-2">
                Каталог
              </a>
              <a href="#portfolio" className="text-dark-gray hover:text-primary transition-colors font-body font-medium py-2">
                Портфолио
              </a>
              <a href="#eco" className="text-dark-gray hover:text-primary transition-colors font-body font-medium py-2">
                Эко-серия
              </a>
              <a href="#contacts" className="text-dark-gray hover:text-primary transition-colors font-body font-medium py-2">
                Контакты
              </a>
              <a href="tel:+74951234567" className="flex items-center space-x-2 text-dark-gray hover:text-primary transition-colors font-body py-2">
                <Phone size={18} />
                <span className="font-medium">+7 (495) 123-45-67</span>
              </a>
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-body font-semibold hover:bg-opacity-90 transition-all w-full">
                Заказать Бриф
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
