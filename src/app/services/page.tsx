import Image from "next/image";
import Link from "next/link";
import InquiryForm from "../_components/InquiryForm";

const services = [
	{
		title: "General Carpentry",
		description:
			"Set stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.",
		image: "/images/business-slide1.jpg",
		link: "/services/general-carpentry",
	},
	{
		title: "Furniture Manufacturing",
		description:
			"Set stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.",
		image: "/images/business-slide2.jpg",
		link: "/services/furniture-manufacturing",
	},
	{
		title: "Furniture Remodeling",
		description:
			"Set stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.",
		image: "/images/business-slide3.jpg",
		link: "/services/furniture-remodeling",
	},
	{
		title: "Wooden Floor",
		description:
			"Set stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.",
		image: "/images/business-slide1.jpg",
		link: "/services/wooden-floor",
	},
	{
		title: "Wooden Furniture",
		description:
			"Set stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.",
		image: "/images/business-slide2.jpg",
		link: "/services/wooden-furniture",
	},
	{
		title: "Custom Work",
		description:
			"Set stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.",
		image: "/images/business-slide3.jpg",
		link: "/services/custom-work",
	},
];

export default function ServicesPage() {
	return (
		<main className="min-h-screen">
			<section className="relative h-64 md:h-80 flex items-center bg-gray-900">
				<Image
					src="/images/business-slide2.jpg"
					alt="Services Background"
					fill
					style={{ objectFit: "cover", zIndex: 1 }}
					className="opacity-60"
					priority
				/>
				<div className="relative z-10 flex flex-col items-start px-8 md:px-24 w-full max-w-5xl mx-auto">
					<h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-left">
						Services
					</h1>
					<nav className="text-white text-lg flex items-center space-x-2 text-left">
						<Link href="/" className="hover:underline">
							Home
						</Link>
						<span>/</span>
						<span>Pages</span>
						<span>/</span>
						<span className="font-semibold">Services</span>
					</nav>
				</div>
			</section>
			<div className="container mx-auto py-12 px-4">
				<h2 className="text-3xl font-bold text-center mb-8">
					Our Services
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{services.map((service, index) => (
						<div
							key={index}
							className="border rounded-lg overflow-hidden shadow-md"
						>
							<Image
								src={service.image}
								alt={service.title}
								width={400}
								height={300}
								className="w-full h-48 object-cover"
							/>
							<div className="p-4">
								<h3 className="text-xl font-semibold mb-2">
									{service.title}
								</h3>
								<p className="text-gray-600 mb-4">
									{service.description}
								</p>
								<a
									href={service.link}
									className="text-blue-500 hover:underline font-medium"
								>
									Read More &rarr;
								</a>
							</div>
						</div>
					))}
				</div>
			</div>
			
			{/* Free Quote Section */}
			<section className="bg-gray-100 py-16">
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
						<div className="relative">
							<Image
								src="/images/business-slide3.jpg"
								alt="Blueprint with tools"
								width={800}
								height={600}
								className="w-full rounded-lg"
							/>
						</div>
						<div className="bg-white p-8 rounded-lg shadow-md">
							<h2 className="text-3xl font-bold mb-2">Free Quote</h2>
							<div className="h-1 w-16 mb-6" style={{ backgroundColor: "#7A4F2A" }}></div>
							<p className="text-gray-600 mb-8">
								Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet
								diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat
								amet
							</p>
							
							<InquiryForm />
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}