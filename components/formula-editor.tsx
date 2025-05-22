"use client"

import { useState, useEffect } from "react"
import { Plus, X, Save, Edit, Trash, GripVertical, AlertTriangle, CheckCircle, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ParameterCombobox } from "@/components/parameter-combobox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// 仮のパラメータデータ
const parameters = [
  { id: "p1", name: "売上高", nameEn: "sales" },
  { id: "p2", name: "原価", nameEn: "cost" },
  { id: "p3", name: "営業利益", nameEn: "operating profit" },
  { id: "p4", name: "販売管理費", nameEn: "selling & admin" },
  { id: "p5", name: "人件費", nameEn: "personnel" },
  { id: "p6", name: "広告宣伝費", nameEn: "advertising" },
  { id: "p7", name: "研究開発費", nameEn: "R&D" },
  { id: "p8", name: "減価償却費", nameEn: "depreciation" },
  { id: "p9", name: "営業外収益", nameEn: "non-op income" },
  { id: "p10", name: "営業外費用", nameEn: "non-op expense" },
  { id: "p11", name: "特別利益", nameEn: "extra gain" },
  { id: "p12", name: "特別損失", nameEn: "extra loss" },
  { id: "p13", name: "税引前当期純利益", nameEn: "profit before tax" },
  { id: "p14", name: "法人税等", nameEn: "corporate tax" },
  { id: "p15", name: "当期純利益", nameEn: "net income" },
]

// 演算子
const operators = [
  { id: "plus", symbol: "+", name: "加算" },
  { id: "minus", symbol: "-", name: "減算" },
  { id: "multiply", symbol: "*", name: "乗算" },
  { id: "divide", symbol: "/", name: "除算" },
  { id: "leftParen", symbol: "(", name: "左括弧" },
  { id: "rightParen", symbol: ")", name: "右括弧" },
]

type FormulaItem = {
  type: "parameter" | "operator" | "number"
  id: string
  display: string
  value: string
}

type Formula = {
  id: string
  name: string
  items: FormulaItem[]
}

type ValidationResult = {
  isValid: boolean
  message: string
}

type CalculationResult = {
  success: boolean
  value?: number
  error?: string
}

type ParameterValue = {
  id: string
  name: string
  value: string
}

// ドラッグ可能な項目コンポーネント
interface SortableItemProps {
  id: string
  item: FormulaItem
  onRemove: () => void
}

function SortableItem({ id, item, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  const getVariant = () => {
    switch (item.type) {
      case "parameter":
        return "default"
      case "number":
        return "outline"
      case "operator":
        return "secondary"
    }
  }

  return (
    <Badge
      ref={setNodeRef}
      style={style}
      variant={getVariant()}
      className="flex items-center gap-1 text-sm py-1.5 cursor-move"
    >
      <span className="mr-1 text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-3 w-3 inline" />
      </span>
      {item.display}
      <button onClick={onRemove} className="ml-1 rounded-full hover:bg-red-500/20">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

export function FormulaEditor() {
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [currentFormula, setCurrentFormula] = useState<Formula | null>(null)
  const [formulaName, setFormulaName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [numberInput, setNumberInput] = useState("")
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, message: "" })
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const [parameterValues, setParameterValues] = useState<ParameterValue[]>([])

  // DnD センサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px動かすとドラッグ開始
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // 数式の構文を検証する関数
  const validateFormula = (items: FormulaItem[]): ValidationResult => {
    if (items.length === 0) {
      return { isValid: false, message: "数式が空です。" }
    }

    // 括弧のバランスをチェック
    let parenCount = 0
    for (let i = 0; i < items.length; i++) {
      if (items[i].value === "(") parenCount++
      if (items[i].value === ")") parenCount--
      if (parenCount < 0) {
        return { isValid: false, message: "括弧の対応が正しくありません。閉じ括弧が多すぎます。" }
      }
    }
    if (parenCount !== 0) {
      return { isValid: false, message: "括弧の対応が正しくありません。開き括弧が多すぎます。" }
    }

    // 演算子の配置をチェック
    const operatorSymbols = ["+", "-", "*", "/"]
    for (let i = 0; i < items.length; i++) {
      const isOperator = operatorSymbols.includes(items[i].value)

      // 最初または最後が演算子でないことを確認
      if (isOperator && (i === 0 || i === items.length - 1)) {
        return { isValid: false, message: "数式の最初または最後に演算子を配置することはできません。" }
      }

      // 連続した演算子がないことを確認
      if (isOperator && i > 0 && operatorSymbols.includes(items[i - 1].value)) {
        return { isValid: false, message: "演算子を連続して配置することはできません。" }
      }

      // 括弧の直後に演算子がないことを確認（乗算の省略は許可）
      if (
        items[i].value === "(" &&
        i > 0 &&
        operatorSymbols.includes(items[i - 1].value) &&
        items[i - 1].value !== "*"
      ) {
        return { isValid: false, message: "括弧の前に適切な演算子または値が必要です。" }
      }

      // 括弧の直前に演算子がないことを確認（乗算の省略は許可）
      if (
        items[i].value === ")" &&
        i < items.length - 1 &&
        operatorSymbols.includes(items[i + 1].value) &&
        items[i + 1].value !== "*"
      ) {
        return { isValid: false, message: "括弧の後に適切な演算子または値が必要です。" }
      }
    }

    // 空の括弧がないことを確認
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].value === "(" && items[i + 1].value === ")") {
        return { isValid: false, message: "空の括弧は使用できません。" }
      }
    }

    return { isValid: true, message: "数式の構文は正しいです。" }
  }

  // 数式を計算する関数
  const calculateFormula = (formula: Formula, paramValues: ParameterValue[]): CalculationResult => {
    try {
      // パラメータ値のマップを作成
      const paramMap = new Map<string, number>()
      paramValues.forEach((param) => {
        paramMap.set(param.id, Number(param.value))
      })

      // 数式を計算可能な式に変換
      let expression = ""
      for (const item of formula.items) {
        if (item.type === "parameter") {
          const paramValue = paramMap.get(item.value)
          if (paramValue === undefined) {
            return { success: false, error: `パラメータ「${item.display}」の値が設定されていません。` }
          }
          expression += paramValue
        } else if (item.type === "number") {
          expression += item.value
        } else if (item.type === "operator") {
          expression += item.value
        }
      }

      // 式を評価
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expression}`)()

      // 結果が有限数かチェック
      if (!isFinite(result)) {
        return { success: false, error: "計算エラー: 無限大または非数値結果" }
      }

      return { success: true, value: result }
    } catch (error) {
      return { success: false, error: `計算エラー: ${(error as Error).message}` }
    }
  }

  // 現在の数式が変更されたときに構文チェックを実行し、パラメータ入力フィールドを初期化
  useEffect(() => {
    if (currentFormula) {
      if (currentFormula.items.length > 0) {
        setValidation(validateFormula(currentFormula.items))

        // 数式内のパラメータを抽出
        const uniqueParams = new Set<string>()
        currentFormula.items.forEach((item) => {
          if (item.type === "parameter") {
            uniqueParams.add(item.value)
          }
        })

        // パラメータ入力フィールドを初期化
        const initialParamValues: ParameterValue[] = Array.from(uniqueParams).map((paramId) => {
          const param = parameters.find((p) => p.id === paramId)
          return {
            id: paramId,
            name: param?.name || paramId,
            value: "",
          }
        })

        setParameterValues(initialParamValues)
        setCalculationResult(null)
      } else {
        setValidation({ isValid: true, message: "" })
        setParameterValues([])
        setCalculationResult(null)
      }
    }
  }, [currentFormula])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !currentFormula) return

    if (active.id !== over.id) {
      const oldIndex = currentFormula.items.findIndex((item) => item.id === active.id)
      const newIndex = currentFormula.items.findIndex((item) => item.id === over.id)

      setCurrentFormula({
        ...currentFormula,
        items: arrayMove(currentFormula.items, oldIndex, newIndex),
      })
    }
  }

  const handleAddNumber = () => {
    if (!currentFormula || !numberInput || isNaN(Number(numberInput))) return

    const newItem: FormulaItem = {
      type: "number",
      id: `number-${Date.now()}`,
      display: numberInput,
      value: numberInput,
    }

    setCurrentFormula({
      ...currentFormula,
      items: [...currentFormula.items, newItem],
    })

    setNumberInput("")
  }

  const handleAddParameter = (parameterId: string) => {
    const parameter = parameters.find((p) => p.id === parameterId)
    if (!parameter || !currentFormula) return

    const newItem: FormulaItem = {
      type: "parameter",
      id: parameter.id + "-" + Date.now(), // ユニークIDを保証
      display: parameter.name,
      value: parameter.id,
    }

    setCurrentFormula({
      ...currentFormula,
      items: [...currentFormula.items, newItem],
    })
  }

  const handleAddOperator = (operatorId: string) => {
    const operator = operators.find((o) => o.id === operatorId)
    if (!operator || !currentFormula) return

    const newItem: FormulaItem = {
      type: "operator",
      id: operator.id + "-" + Date.now(), // ユニークIDを保証
      display: operator.symbol,
      value: operator.symbol,
    }

    setCurrentFormula({
      ...currentFormula,
      items: [...currentFormula.items, newItem],
    })
  }

  const handleRemoveItem = (index: number) => {
    if (!currentFormula) return

    const newItems = [...currentFormula.items]
    newItems.splice(index, 1)

    setCurrentFormula({
      ...currentFormula,
      items: newItems,
    })
  }

  const handleCreateNewFormula = () => {
    setCurrentFormula({
      id: `formula-${Date.now()}`,
      name: "",
      items: [],
    })
    setFormulaName("")
    setIsEditing(false)
    setValidation({ isValid: true, message: "" })
  }

  const handleSaveFormula = () => {
    if (!currentFormula || !formulaName.trim() || !validation.isValid) return

    const updatedFormula = {
      ...currentFormula,
      name: formulaName,
    }

    if (isEditing) {
      setFormulas(formulas.map((f) => (f.id === updatedFormula.id ? updatedFormula : f)))
    } else {
      setFormulas([...formulas, updatedFormula])
    }

    setCurrentFormula(null)
    setFormulaName("")
  }

  const handleEditFormula = (formula: Formula) => {
    setCurrentFormula(formula)
    setFormulaName(formula.name)
    setIsEditing(true)
    setValidation(validateFormula(formula.items))
  }

  const handleDeleteFormula = (id: string) => {
    setFormulas(formulas.filter((f) => f.id !== id))
  }

  const handleExecuteCalculation = () => {
    if (!currentFormula) return

    // すべてのパラメータに値が入力されているか確認
    const allParamsHaveValues = parameterValues.every((param) => param.value !== "")
    if (!allParamsHaveValues) {
      setCalculationResult({
        success: false,
        error: "すべてのパラメータに値を入力してください。",
      })
      return
    }

    // 数式を計算
    const result = calculateFormula(currentFormula, parameterValues)
    setCalculationResult(result)
  }

  const getFormulaString = (items: FormulaItem[]) => {
    return items.map((item) => item.display).join(" ")
  }

  const handleParameterValueChange = (id: string, value: string) => {
    setParameterValues((prevValues) => prevValues.map((param) => (param.id === id ? { ...param, value } : param)))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">登録済み数式一覧</h2>
        <Dialog
          open={!!currentFormula}
          onOpenChange={(open) => {
            if (!open) setCurrentFormula(null)
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={handleCreateNewFormula}>
              <Plus className="mr-2 h-4 w-4" />
              新規数式を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "数式を編集" : "新規数式を作成"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="formula-name">数式名</Label>
                <Input
                  id="formula-name"
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  placeholder="数式の名前を入力してください"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  数式 <span className="text-xs text-muted-foreground">（ドラッグで並べ替え可能）</span>
                </Label>
                <div className="flex flex-wrap gap-2 p-3 min-h-[100px] border rounded-md">
                  {currentFormula && currentFormula.items.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext
                        items={currentFormula.items.map((item) => item.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {currentFormula.items.map((item, index) => (
                          <SortableItem
                            key={item.id}
                            id={item.id}
                            item={item}
                            onRemove={() => handleRemoveItem(index)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-muted-foreground text-sm w-full text-center py-4">
                      パラメータ、演算子、数値を追加して数式を作成してください
                    </div>
                  )}
                </div>

                {/* 構文チェック結果の表示 */}
                {currentFormula && currentFormula.items.length > 0 && (
                  <Alert variant={validation.isValid ? "default" : "destructive"} className="mt-2">
                    {validation.isValid ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    <AlertDescription>{validation.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>パラメータを追加</Label>
                  <ParameterCombobox items={parameters} onSelect={handleAddParameter} />
                </div>
                <div className="space-y-2">
                  <Label>演算子を追加</Label>
                  <ParameterCombobox items={operators} onSelect={handleAddOperator} displayKey="symbol" />
                </div>
                <div className="space-y-2">
                  <Label>数値を追加</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="数値を入力"
                      value={numberInput}
                      onChange={(e) => {
                        // Only allow valid numeric values
                        const value = e.target.value
                        if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                          setNumberInput(value)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddNumber()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddNumber} disabled={!numberInput}>
                      追加
                    </Button>
                  </div>
                </div>
              </div>

              {/* 計算セクション - 数式が有効な場合のみ表示 */}
              {currentFormula && currentFormula.items.length > 0 && validation.isValid && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">数式の検証</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExecuteCalculation}
                      disabled={!validation.isValid || parameterValues.some((p) => p.value === "")}
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      計算実行
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label>パラメータ値の入力</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {parameterValues.map((param) => (
                        <div key={param.id} className="flex items-center gap-2">
                          <Label htmlFor={`param-${param.id}`} className="w-full max-w-[120px] text-sm">
                            {param.name}
                          </Label>
                          <Input
                            id={`param-${param.id}`}
                            type="number"
                            step="0.01"
                            value={param.value}
                            onChange={(e) => handleParameterValueChange(param.id, e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {calculationResult && (
                    <Alert variant={calculationResult.success ? "default" : "destructive"} className="mt-4">
                      {calculationResult.success ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                      )}
                      <AlertDescription>
                        {calculationResult.success
                          ? `計算結果: ${calculationResult.value?.toLocaleString()}`
                          : calculationResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">キャンセル</Button>
              </DialogClose>
              <Button
                onClick={handleSaveFormula}
                disabled={
                  !formulaName.trim() ||
                  currentFormula?.items.length === 0 ||
                  !validation.isValid ||
                  !calculationResult?.success
                }
              >
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {formulas.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          登録された数式はありません。「新規数式を追加」ボタンから数式を作成してください。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {formulas.map((formula) => (
            <Card key={formula.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{formula.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditFormula(formula)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>数式を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{formula.name}」を削除します。この操作は元に戻せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFormula(formula.id)}>削除</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded-md overflow-x-auto">
                  <code className="text-sm whitespace-nowrap">{getFormulaString(formula.items)}</code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
