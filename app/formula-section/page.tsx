import { FormulaEditor } from '@/components/formula-editor';

export default function DBListPage() {
  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-3xl font-bold mb-6">数式エディタ</h1>
        <FormulaEditor />
    </div>
  );
}
