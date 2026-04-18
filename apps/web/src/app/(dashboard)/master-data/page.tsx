import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Layers, Users, Truck } from 'lucide-react';

const sections = [
  { href: '/master-data/products', label: 'Sản phẩm', desc: 'Quản lý sản phẩm, BOM & quy trình sản xuất', icon: Package },
  { href: '/master-data/items', label: 'Vật tư', desc: 'Nguyên liệu, phụ kiện, bán thành phẩm', icon: Layers },
  { href: '/master-data/customers', label: 'Khách hàng', desc: 'Danh sách khách hàng & thông tin liên hệ', icon: Users },
  { href: '/master-data/suppliers', label: 'Nhà cung cấp', desc: 'Danh sách nhà cung cấp vật tư', icon: Truck },
];

export default function MasterDataPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dữ liệu chủ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <s.icon className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <CardTitle className="text-lg">{s.label}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
