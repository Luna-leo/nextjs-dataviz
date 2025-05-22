import DBListTable from '@/components/DBListTable';

export default function DBListPage() {
  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-xl font-bold mb-4">DB化済みデータ一覧</h1>
      <div className="flex-grow min-h-0">
        <DBListTable />
      </div>
    </div>
  );
}
