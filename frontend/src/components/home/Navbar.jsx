import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../../assets/logo.svg";

export default function Navbar({ scrolled, isLoggedIn, handlePrimaryCTA }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center transition-all duration-300">
      <div
        className={`
          w-[94%] md:w-[90%] lg:w-[85%]
          rounded-2xl px-6 py-4 flex items-center justify-between
          transition-all duration-300
          ${scrolled ? "bg-white/80 backdrop-blur-2xl shadow-xl" : "bg-white/80 backdrop-blur-xl shadow"}
        `}
      >
        <div className="flex items-center gap-3">

            <img src={logo} alt="ZenovaX Logo" className="h-6 object-contain drop-shadow-sm" />
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-gray-700 hover:text-[#7A79E6] font-medium transition"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <button
                onClick={handlePrimaryCTA}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-200 transition"
              >
                Login
              </button>
              <button
                onClick={handlePrimaryCTA}
                className="px-6 py-2 rounded-full bg-[#7A79E6] text-white font-semibold shadow-md hover:bg-[#6b6ad6] hover:shadow-xl transition"
              >
                Sign Up
              </button>
            </>
          ) : (
            <button
              onClick={handlePrimaryCTA}
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-[#6c6bd6] transition"
            >
              Dashboard
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden w-[94%] mx-auto mt-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 py-6 px-6 space-y-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 font-medium text-lg hover:text-[#7A79E6] transition"
            >
              {link.name}
            </a>
          ))}

          <div className="pt-4 border-t border-gray-200 space-y-3">
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    handlePrimaryCTA();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-[#6c6bd6] transition"
                >
                  Login
                </button>

                <button
                  onClick={() => {
                    handlePrimaryCTA();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-3 rounded-full bg-[#7A79E6] text-white font-semibold shadow-md hover:shadow-lg hover:bg-[#6c6bd6] transition"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  handlePrimaryCTA();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-[#6c6bd6] transition"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}