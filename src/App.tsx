import BookingApp from './components/BookingApp';

const App = () => {
  return (
    <div className="min-h-screen w-full flex flex-col text-zinc-900">
      <header className="flex-shrink-0 flex items-center justify-between gap-4 px-5 sm:px-8 py-4 border-b border-zinc-200/80 bg-white/70 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-brand-900/20">
            G
          </div>
          <span className="font-display text-xl sm:text-2xl tracking-wide text-brand-900">
            The Greene Haven
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-7 text-sm text-zinc-600">
          <a href="#home" className="hover:text-brand-700 transition-colors">
            Home
          </a>
          <a href="#book" className="hover:text-brand-700 transition-colors">
            Book
          </a>
          <a href="#about" className="hover:text-brand-700 transition-colors">
            About
          </a>
        </nav>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 md:p-10">
        <BookingApp />
      </main>
    </div>
  );
};

export default App;
