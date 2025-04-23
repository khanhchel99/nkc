import Link from "next/link";
import Image from "next/image";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { api as clientApi } from "@/trpc/react";
import Carousel from "./_components/Carousel";
import { LuUserCheck, LuCheck, LuMessagesSquare, LuHeadphones } from "react-icons/lu";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.user.getCurrentUser.prefetch();
  }

  return (
    <HydrateClient>
      {/* Hero Carousel */}
      <Carousel />

      {/* Feature Highlights Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-12 md:gap-24">
            {/* Feature 1 */}
            <div className="flex flex-col items-center">
              <div className="bg-[#F5F5F5] p-4 rounded mb-4">
                <LuUserCheck className="w-10 h-10 text-[#B47B3A]" />
              </div>
              <div className="text-5xl font-bold text-[#F5F5F5] mb-2">01</div>
              <div className="font-semibold text-lg text-stone-800">Creative Designers</div>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-center">
              <div className="bg-[#F5F5F5] p-4 rounded mb-4">
                <LuCheck className="w-10 h-10 text-[#B47B3A]" />
              </div>
              <div className="text-5xl font-bold text-[#F5F5F5] mb-2">02</div>
              <div className="font-semibold text-lg text-stone-800">Quality Products</div>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-center">
              <div className="bg-[#F5F5F5] p-4 rounded mb-4">
                <LuMessagesSquare className="w-10 h-10 text-[#B47B3A]" />
              </div>
              <div className="text-5xl font-bold text-[#F5F5F5] mb-2">03</div>
              <div className="font-semibold text-lg text-stone-800">Free Consultation</div>
            </div>
            {/* Feature 4 */}
            <div className="flex flex-col items-center">
              <div className="bg-[#F5F5F5] p-4 rounded mb-4">
                <LuHeadphones className="w-10 h-10 text-[#B47B3A]" />
              </div>
              <div className="text-5xl font-bold text-[#F5F5F5] mb-2">04</div>
              <div className="font-semibold text-lg text-stone-800">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#895D35]">Our Services</h2>
            <p className="text-lg max-w-2xl mx-auto text-stone-600">Explore our range of professional services designed to help your business thrive in today's competitive environment.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Business Consulting', desc: 'Strategic advice and solutions to help your business grow and overcome challenges.' },
              { title: 'Financial Planning', desc: 'Comprehensive financial strategies to optimize your business operations and investments.' },
              { title: 'Digital Transformation', desc: 'Innovative digital solutions to modernize your business and improve efficiency.' }
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-amber-100 h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-semibold text-[#895D35]">Service Image {index + 1}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#895D35]">{service.title}</h3>
                  <p className="text-stone-600 mb-4">{service.desc}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[#895D35]">Starting at $499</span>
                    <Link href={`/services/${index + 1}`} className="bg-[#895D35] text-amber-50 px-4 py-2 rounded hover:bg-[#7A4F2A]">
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/services" className="bg-[#895D35] text-amber-50 px-6 py-3 rounded-md font-semibold hover:bg-[#7A4F2A] inline-block">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-amber-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-[#895D35]">About NKC</h2>
              <p className="text-lg mb-6 text-stone-700">
                For over 15 years, NKC has been providing exceptional business services to clients across various industries. Our team of experienced professionals is dedicated to delivering customized solutions that address your unique business challenges.
              </p>
              <p className="text-lg mb-8 text-stone-700">
                We pride ourselves on building long-term relationships with our clients, understanding their needs, and helping them achieve their business goals through strategic planning and innovative solutions.
              </p>
              <Link href="/about" className="bg-[#895D35] text-amber-50 px-6 py-3 rounded-md font-semibold hover:bg-[#7A4F2A] inline-block">
                Learn More
              </Link>
            </div>
            <div className="bg-amber-200 h-96 rounded-lg relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-semibold text-[#895D35]">Our Team</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Profile Section (visible only when logged in) */}
      {session?.user && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto">
              <div className="bg-amber-50 rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold mb-6 text-[#895D35]">Your Profile</h2>
                <UserProfile />
              </div>
            </div>
          </div>
        </section>
      )}
    </HydrateClient>
  );
}

// UserProfile component that displays user information
function UserProfile() {
  const { data: user, isLoading } = clientApi.user.getCurrentUser.useQuery();

  if (isLoading) {
    return <div className="text-center text-[#895D35]">Loading profile...</div>;
  }

  if (!user) {
    return <div className="text-center text-[#895D35]">User not found</div>;
  }

  return (
    <div>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[#895D35]/70">Name</p>
          <p className="text-xl">{user.name ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-sm text-[#895D35]/70">Email</p>
          <p className="text-xl">{user.email ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-sm text-[#895D35]/70">Title</p>
          <p className="text-xl">{user.title ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-sm text-[#895D35]/70">Company</p>
          <p className="text-xl">{user.company ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-sm text-[#895D35]/70">Phone</p>
          <p className="text-xl">{user.phone ?? "Not set"}</p>
        </div>
      </div>
      <div className="mt-6">
        <Link href="/profile/edit" className="bg-[#895D35] text-amber-50 px-4 py-2 rounded hover:bg-[#7A4F2A] inline-block">
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
