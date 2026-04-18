import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">NKC ERP</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Hệ thống Quản lý Sản xuất Nội thất
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
        <NavCard href="/dashboard" title="Tổng quan" description="Báo cáo & chỉ số KPI" />
        <NavCard href="/master-data" title="Dữ liệu chủ" description="Sản phẩm, BOM, Quy trình" />
        <NavCard href="/orders" title="Đơn hàng" description="Nhập & quản lý đơn hàng" />
        <NavCard href="/planning" title="Kế hoạch" description="MRP & kế hoạch sản xuất" />
        <NavCard href="/production" title="Sản xuất" description="Lệnh sản xuất & theo dõi" />
        <NavCard href="/inventory" title="Kho hàng" description="Quản lý tồn kho" />
        <NavCard href="/quality" title="Chất lượng" description="Kiểm tra & kiểm soát" />
      </div>
    </div>
  );
}

function NavCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col p-6 border rounded-lg hover:bg-accent transition-colors"
    >
      <h2 className="font-semibold text-lg">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
