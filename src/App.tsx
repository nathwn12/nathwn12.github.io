import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { SelectedWork } from "./components/SelectedWork";
import { HowIWork } from "./components/HowIWork";
import { About } from "./components/About";
import { ContactSection } from "./components/ContactSection";

/**
 * Hiring portfolio — one page in the guideline's order:
 * hero, selected work, how I work, about, contact.
 * No router, no animation runtime, no install strings.
 */
export default function App() {
  return (
    <div id="top" className="min-h-screen bg-[#FFFFFF] text-[#111111]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-[#FFFFFF] focus:px-4 focus:py-3 focus:text-[#0B57D0] focus:outline-2 focus:outline-[#0B57D0]"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="bg-[#FFFFFF]">
        <Hero />
        <div id="work">
          <SelectedWork />
        </div>
        <div id="how">
          <HowIWork />
        </div>
        <div id="about">
          <About />
        </div>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
