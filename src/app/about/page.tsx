import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <section className="relative h-64 md:h-80 flex items-center bg-gray-900">
      <Image
        src="/images/business-slide1.jpg"
        alt="About Us Background"
        fill
        style={{ objectFit: 'cover', zIndex: 1 }}
        className="opacity-60"
        priority
      />
      <div className="relative z-10 flex flex-col items-start px-8 md:px-24 w-full max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-left">About Us</h1>
        <nav className="text-white text-lg flex items-center space-x-2 text-left">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span>Pages</span>
          <span>/</span>
          <span className="font-semibold">About</span>
        </nav>
      </div>
    </section>
  );
}
