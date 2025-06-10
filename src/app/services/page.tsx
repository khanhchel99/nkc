"use client";

import Image from "next/image";
import Link from "next/link";
import InquiryForm from "../_components/InquiryForm";
import { useI18n } from "../i18n";

const services = [
	{
		title: "general_carpentry",
		description: "general_carpentry_desc",
		image: "/images/business-slide1.jpg",
		link: "/services/general-carpentry",
	},
	{
		title: "furniture_manufacturing",
		description: "furniture_manufacturing_desc",
		image: "/images/business-slide2.jpg",
		link: "/services/furniture-manufacturing",
	},
	{
		title: "furniture_remodeling",
		description: "furniture_remodeling_desc",
		image: "/images/business-slide3.jpg",
		link: "/services/furniture-remodeling",
	},
	{
		title: "wooden_floor",
		description: "wooden_floor_desc",
		image: "/images/business-slide1.jpg",
		link: "/services/wooden-floor",
	},
	{
		title: "wooden_furniture",
		description: "wooden_furniture_desc",
		image: "/images/business-slide2.jpg",
		link: "/services/wooden-furniture",
	},
	{
		title: "custom_work",
		description: "custom_work_desc",
		image: "/images/business-slide3.jpg",
		link: "/services/custom-work",
	},
];

export default function ServicesPage() {
	const { t } = useI18n();
	return (
		<main className="min-h-screen">
			<section className="relative h-48 md:h-60 flex items-center bg-gray-900">
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
						{t("services")}
					</h1>
				</div>
			</section>
			<div className="container mx-auto py-12 px-4">
				<h2 className="text-3xl font-bold text-center mb-8">
					{t("our_services")}
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{services.map((service, index) => (
						<div
							key={index}
							className="border rounded-lg overflow-hidden shadow-md"
						>
							<Image
								src={service.image}
								alt={t(service.title)}
								width={400}
								height={300}
								className="w-full h-48 object-cover"
							/>
							<div className="p-4">
								<h3 className="text-xl font-semibold mb-2">
									{t(service.title)}
								</h3>
								<p className="text-gray-600 mb-4">
									{t(service.description)}
								</p>
								<a
									href={service.link}
									className="text-blue-500 hover:underline font-medium"
								>
									{t("read_more")} &rarr;
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
							<h2 className="text-3xl font-bold mb-2">
								{t("free_quote")}
							</h2>
							<div
								className="h-1 w-16 mb-6"
								style={{ backgroundColor: "#7A4F2A" }}
							></div>
							<p className="text-gray-600 mb-8">
								{t("free_quote_desc")}
							</p>

							<InquiryForm />
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}