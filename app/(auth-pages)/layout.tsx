export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-12 items-center h-full justify-center">
      {children}
    </div>
  );
}
