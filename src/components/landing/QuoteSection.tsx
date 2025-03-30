
const QuoteSection = () => {
  return (
    <div className="py-16 px-4 bg-bookconnect-sage/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1550399105-c4db5fb85c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <svg className="h-12 w-12 text-bookconnect-terracotta opacity-50 mx-auto mb-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 11C10 8.22 7.77 6 5 6V15C5 17.77 7.22 20 10 20V11Z" fill="currentColor" />
          <path d="M19 11C19 8.22 16.77 6 14 6V15C14 17.77 16.22 20 19 20V11Z" fill="currentColor" />
        </svg>
        
        <p className="text-xl md:text-2xl lg:text-3xl font-serif italic font-medium text-bookconnect-brown">
          "A reader lives a thousand lives before he dies. The man who never reads lives only one."
        </p>
        <div className="mt-4 text-bookconnect-brown/70">— George R.R. Martin</div>
      </div>
    </div>
  );
};

export default QuoteSection;
