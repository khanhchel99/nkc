"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '../i18n';

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <>
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
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-left">{t('about')}</h1>
          <nav className="text-white text-lg flex items-center space-x-2 text-left">
            <Link href="/" className="hover:underline">{t('home') || 'Home'}</Link>
            <span>/</span>
            <span>{t('pages') || 'Pages'}</span>
            <span>/</span>
            <span className="font-semibold">{t('about')}</span>
          </nav>
        </div>
      </section>

      {/* About Us Content Section */}
      <section className="bg-white py-16 px-4 md:px-0">
        <div className="max-w-5xl mx-auto flex flex-col gap-16">
          {/* Our Story */}
          <div className="mb-0 grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#895D35] mb-4 font-serif">{t('story') || 'OUR STORY'}</h2>
              <p className="text-gray-700 text-lg leading-relaxed font-sans">
                Founded with a passion for craftsmanship and a commitment to quality, our furniture company has been creating beautiful, timeless pieces for over a decade.
              </p>
            </div>
            <div>
              <p className="text-gray-700 text-lg leading-relaxed font-sans">
                A commitment to quality, our furniture company has been creating beautiful, timeless pieces for over a decade. We believe in the art of handcrafting and the use of sustainable materials to produce furniture that is both functional and aesthetically pleasing.
              </p>
            </div>
          </div>

          {/* Our History */}
          <div className="mb-0">
            <h2 className="text-2xl md:text-3xl font-bold text-[#895D35] mb-6 font-serif">{t('history') || 'OUR HISTORY'}</h2>
            <div className="relative mb-8 pt-4">
              {/* Years row */}
              <div className="flex justify-between items-end text-[#895D35] font-semibold text-lg mb-0 relative z-10">
                <div className="flex flex-col items-center w-1/4">
                  <span className="mb-2">2010</span>
                </div>
                <div className="flex flex-col items-center w-1/4">
                  <span className="mb-2">2013</span>
                </div>
                <div className="flex flex-col items-center w-1/4">
                  <span className="mb-2">2017</span>
                </div>
                <div className="flex flex-col items-center w-1/4">
                  <span className="mb-2">2022</span>
                </div>
              </div>
              {/* Timeline line with dots absolutely positioned */}
              <div className="relative" style={{height: '24px'}}>
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#895D35]/30 z-0" style={{marginLeft: '2%', marginRight: '2%', transform: 'translateY(-50%)'}} />
                <div className="flex justify-between items-center absolute left-0 right-0 top-1/2 w-full" style={{transform: 'translateY(-50%)'}}>
                  <div className="flex justify-center w-1/4">
                    <div className="w-3 h-3 bg-[#895D35] rounded-full z-10" />
                  </div>
                  <div className="flex justify-center w-1/4">
                    <div className="w-3 h-3 bg-[#895D35] rounded-full z-10" />
                  </div>
                  <div className="flex justify-center w-1/4">
                    <div className="w-3 h-3 bg-[#895D35] rounded-full z-10" />
                  </div>
                  <div className="flex justify-center w-1/4">
                    <div className="w-3 h-3 bg-[#895D35] rounded-full z-10" />
                  </div>
                </div>
              </div>
              {/* Descriptions row */}
              <div className="flex justify-between items-start text-[#895D35] font-semibold text-lg mb-0 relative z-10 mt-2">
                <div className="flex flex-col items-center w-1/4">
                  <span className="text-sm text-gray-600 text-center">Company founded</span>
                </div>
                <div className="flex flex-col items-center w-1/4">
                  <span className="text-sm text-gray-600 text-center">Opened our first workshop</span>
                </div>
                <div className="flex flex-col items-center w-1/4">
                  <span className="text-sm text-gray-600 text-center">Launched our flagship showroom</span>
                </div>
                <div className="flex flex-col items-center w-1/4">
                  <span className="text-sm text-gray-600 text-center">Expanded to a larger production facility</span>
                </div>
              </div>
            </div>
          </div>

          {/* Our Team */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#895D35] mb-8 font-serif">{t('team') || 'OUR TEAM'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <div className="w-32 h-40 bg-gray-200 rounded-md overflow-hidden mb-3">
                  <Image src="/images/business-slide5.jpg" alt="John Doe" width={128} height={160} className="object-cover w-full h-full" />
                </div>
                <span className="font-bold text-lg text-gray-900 mb-1">John Doe</span>
                <span className="text-sm text-gray-600">Founder & CEO</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-32 h-40 bg-gray-200 rounded-md overflow-hidden mb-3">
                  <Image src="/images/business-slide6.jpg" alt="Jane Smith" width={128} height={160} className="object-cover w-full h-full" />
                </div>
                <span className="font-bold text-lg text-gray-900 mb-1">Jane Smith</span>
                <span className="text-sm text-gray-600">Head of Design</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-32 h-40 bg-gray-200 rounded-md overflow-hidden mb-3">
                  <Image src="/images/team3.jpg" alt="Michael Johnson" width={128} height={160} className="object-cover w-full h-full" />
                </div>
                <span className="font-bold text-lg text-gray-900 mb-1">Michael Johnson</span>
                <span className="text-sm text-gray-600">Production Manager</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-32 h-40 bg-gray-200 rounded-md overflow-hidden mb-3">
                  <Image src="/images/team4.jpg" alt="Emily White" width={128} height={160} className="object-cover w-full h-full" />
                </div>
                <span className="font-bold text-lg text-gray-900 mb-1">Emily White</span>
                <span className="text-sm text-gray-600">Customer Relations</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
