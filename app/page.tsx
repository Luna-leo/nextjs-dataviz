import SensorTable from './components/SensorTable';

export default function Home() {
  return (
    <main className="flex flex-col h-screen p-4">
      <h1 className="text-xl font-bold mb-4">UNIT TAG マスター</h1>
      <div className="flex-grow min-h-0">
        <SensorTable />
      </div>
    </main>
  );
}
