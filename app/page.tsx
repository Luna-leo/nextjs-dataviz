import SensorTable from "./components/SensorTable";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <main className="flex w-full flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold">Sensor Table</h1>
      <SensorTable />
    </main>
    </div>
  );
}
