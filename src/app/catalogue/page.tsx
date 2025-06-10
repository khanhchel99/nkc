"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Mock data for demonstration
const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Office"];
const FURNITURE_TYPES = ["Sofa", "Table", "Chair", "Bed", "Cabinet"];
const FURNITURE_COMBOS = ["Living Room Set", "Bedroom Combo", "Dining Set"];

const PRODUCTS = [
  {
    id: 1,
    name: "Classic Sofa",
    image: "/images/business-slide1.jpg",
    room: "Living Room",
    type: "Sofa",
    combo: "Living Room Set",
    price: "$499",
  },
  {
    id: 2,
    name: "Modern Bed",
    image: "/images/business-slide2.jpg",
    room: "Bedroom",
    type: "Bed",
    combo: "Bedroom Combo",
    price: "$799",
  },
  {
    id: 3,
    name: "Dining Table",
    image: "/images/business-slide3.jpg",
    room: "Kitchen",
    type: "Table",
    combo: "Dining Set",
    price: "$599",
  },
  {
    id: 4,
    name: "Office Chair",
    image: "/images/business-slide1.jpg",
    room: "Office",
    type: "Chair",
    combo: "",
    price: "$299",
  },
  {
    id: 5,
    name: "Wardrobe",
    image: "/images/business-slide2.jpg",
    room: "Bedroom",
    type: "Cabinet",
    combo: "Bedroom Combo",
    price: "$899",
  },
  {
    id: 6,
    name: "Coffee Table",
    image: "/images/business-slide3.jpg",
    room: "Living Room",
    type: "Table",
    combo: "Living Room Set",
    price: "$299",
  },
];

export default function CataloguePage() {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCombos, setSelectedCombos] = useState<string[]>([]);

  // Filtering logic
  const filteredProducts = PRODUCTS.filter((p) => {
    const roomMatch = selectedRooms.length === 0 || selectedRooms.includes(p.room);
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(p.type);
    const comboMatch = selectedCombos.length === 0 || selectedCombos.includes(p.combo);
    return roomMatch && typeMatch && comboMatch;
  });

  // Handlers
  const toggleFilter = (value: string, selected: string[], setSelected: (v: string[]) => void) => {
    setSelected(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const clearFilters = () => {
    setSelectedRooms([]);
    setSelectedTypes([]);
    setSelectedCombos([]);
  };

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 bg-white rounded-lg shadow-md p-6 mb-8 md:mb-0">
          <h2 className="text-xl font-bold mb-4 text-[#895D35]">Filters</h2>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Room Type</h3>
            {ROOM_TYPES.map((room) => (
              <label key={room} className="flex items-center mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room)}
                  onChange={() => toggleFilter(room, selectedRooms, setSelectedRooms)}
                  className="mr-2 accent-[#895D35]"
                />
                {room}
              </label>
            ))}
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Furniture Type</h3>
            {FURNITURE_TYPES.map((type) => (
              <label key={type} className="flex items-center mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                  className="mr-2 accent-[#895D35]"
                />
                {type}
              </label>
            ))}
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Furniture Combo</h3>
            {FURNITURE_COMBOS.map((combo) => (
              <label key={combo} className="flex items-center mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCombos.includes(combo)}
                  onChange={() => toggleFilter(combo, selectedCombos, setSelectedCombos)}
                  className="mr-2 accent-[#895D35]"
                />
                {combo}
              </label>
            ))}
          </div>
          <button
            onClick={clearFilters}
            className="mt-2 bg-[#895D35] text-white px-4 py-2 rounded hover:bg-[#7A4F2A] w-full font-semibold"
          >
            Clear Filters
          </button>
        </aside>

        {/* Product Grid */}
        <section className="flex-1">
          <h1 className="text-3xl font-bold mb-6 text-[#895D35]">Catalogue</h1>
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-16">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/catalogue/${product.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col group"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold mb-2 text-[#895D35] group-hover:text-[#7A4F2A] transition-colors">{product.name}</h3>
                    <div className="text-sm text-gray-500 mb-1">{product.room} &bull; {product.type}</div>
                    {product.combo && <div className="text-xs text-amber-700 mb-2">{product.combo}</div>}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold text-[#895D35]">{product.price}</span>
                      <span className="bg-[#895D35] text-white px-3 py-1 rounded hover:bg-[#7A4F2A] text-sm font-medium transition-colors group-hover:bg-[#7A4F2A]">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
