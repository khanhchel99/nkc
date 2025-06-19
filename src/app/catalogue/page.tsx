"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useI18n } from "../i18n";

export default function CataloguePage() {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCombos, setSelectedCombos] = useState<string[]>([]);
  const { locale, t } = useI18n();

  // Translation helper functions
  const translateRoomType = (room: string) => {
    const roomMap: Record<string, string> = {
      'Living Room': t("living_room"),
      'Bedroom': t("bedroom"),
      'Kitchen': t("kitchen"),
      'Office': t("office"),
      'Dining Room': t("dining_room")
    };
    return roomMap[room] || room;
  };

  const translateFurnitureType = (type: string) => {
    const typeMap: Record<string, string> = {
      'Sofa': t("sofa"),
      'Bed': t("bed"),
      'Table': t("table"),
      'Chair': t("chair"),
      'Cabinet': t("cabinet"),
      'Desk': t("desk")
    };
    return typeMap[type] || type;
  };

  const translateComboType = (combo: string) => {
    const comboMap: Record<string, string> = {
      'Dining Set': t("dining_set"),
      'Bedroom Combo': t("bedroom_combo"),
      'Living Room Set': t("living_room_set"),
      'Office Set': t("office_set")
    };
    return comboMap[combo] || combo;
  };

  // Fetch data from database using TRPC with current locale
  const { data: products = [], isLoading: productsLoading } = api.product.getAll.useQuery({ locale });
  const { data: roomTypes = [], isLoading: roomTypesLoading } = api.product.getRoomTypes.useQuery();
  const { data: furnitureTypes = [], isLoading: furnitureTypesLoading } = api.product.getFurnitureTypes.useQuery();

  // Extract furniture combos from products
  const furnitureCombos = Array.from(new Set(products.map((p: any) => p.combo).filter(Boolean)));
  // Filtering logic
  const filteredProducts = products.filter((p: any) => {
    const roomMatch = selectedRooms.length === 0 || selectedRooms.includes(p.room);
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(p.type);
    const comboMatch = selectedCombos.length === 0 || (p.combo && selectedCombos.includes(p.combo));
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

  if (productsLoading || roomTypesLoading || furnitureTypesLoading) {
    return (
      <main className="min-h-screen bg-stone-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
            <p className="mt-4 text-gray-600">{t("loading_catalogue")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 bg-white rounded-lg shadow-md p-6 mb-8 md:mb-0">
          <h2 className="text-xl font-bold mb-4 text-[#895D35]">{t("filters")}</h2>          <div className="mb-4">
            <h3 className="font-semibold mb-2">{t("room_type")}</h3>            {roomTypes.map((room: string) => (
              <label key={room} className="flex items-center mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room)}
                  onChange={() => toggleFilter(room, selectedRooms, setSelectedRooms)}
                  className="mr-2 accent-[#895D35]"
                />
                {translateRoomType(room)}
              </label>
            ))}
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">{t("furniture_type")}</h3>            {furnitureTypes.map((type: string) => (
              <label key={type} className="flex items-center mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                  className="mr-2 accent-[#895D35]"
                />
                {translateFurnitureType(type)}
              </label>
            ))}
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">{t("furniture_combo")}</h3>            {furnitureCombos.map((combo: string) => (
              <label key={combo} className="flex items-center mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCombos.includes(combo)}
                  onChange={() => toggleFilter(combo, selectedCombos, setSelectedCombos)}
                  className="mr-2 accent-[#895D35]"
                />
                {translateComboType(combo)}
              </label>
            ))}
          </div>
          <button
            onClick={clearFilters}            className="mt-2 bg-[#895D35] text-white px-4 py-2 rounded hover:bg-[#7A4F2A] w-full font-semibold"
          >
            {t("clear_filters")}
          </button>
        </aside>

        {/* Product Grid */}
        <section className="flex-1">
          <h1 className="text-3xl font-bold mb-6 text-[#895D35]">{t("catalogue")}</h1>
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-16">{t("no_products_found")}</div>          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/catalogue/${product.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col group"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={product.images?.[0] || "/images/business-slide1.jpg"}
                      alt={product.name}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold mb-2 text-[#895D35] group-hover:text-[#7A4F2A] transition-colors">
                      {product.name}
                    </h3>                    <div className="text-sm text-gray-500 mb-1">{translateRoomType(product.room)} &bull; {translateFurnitureType(product.type)}</div>
                    {product.combo && <div className="text-xs text-amber-700 mb-2">{translateComboType(product.combo)}</div>}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold text-[#895D35]">${product.price}</span>                      <span className="bg-[#895D35] text-white px-3 py-1 rounded hover:bg-[#7A4F2A] text-sm font-medium transition-colors group-hover:bg-[#7A4F2A]">
                        {t("view_details")}
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
