import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

interface DocumentItem {
  qty: number;
  description: string;
  unit_price: number;
  amount: number;
}

interface DocumentEditorProps {
  items: DocumentItem[];
  laborCost: number;
  notes: string;
  attentionTo: string;
  onItemsChange: (items: DocumentItem[]) => void;
  onLaborCostChange: (cost: number) => void;
  onNotesChange: (notes: string) => void;
  onAttentionToChange: (value: string) => void;
}

export function DocumentEditor({
  items,
  laborCost,
  notes,
  attentionTo,
  onItemsChange,
  onLaborCostChange,
  onNotesChange,
  onAttentionToChange,
}: DocumentEditorProps) {
  const addRow = () => {
    onItemsChange([...items, { qty: 1, description: "", unit_price: 0, amount: 0 }]);
  };

  const removeRow = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DocumentItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate amount
    if (field === 'qty' || field === 'unit_price') {
      newItems[index].amount = newItems[index].qty * newItems[index].unit_price;
    }
    
    onItemsChange(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + laborCost;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="attention_to">Attention To</Label>
        <Input
          id="attention_to"
          value={attentionTo}
          onChange={(e) => onAttentionToChange(e.target.value)}
          placeholder="Recipient name or organization"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Line Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">QTY</TableHead>
                <TableHead>DESCRIPTION</TableHead>
                <TableHead className="w-32">UNIT PRICE</TableHead>
                <TableHead className="w-32">AMOUNT</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No items yet. Click "Add Row" to start.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      K {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Grid Layout for Items */}
        <div className="md:hidden space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border rounded-lg border-dashed">
              No items yet. Click "Add Row" to start.
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg bg-card space-y-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>QTY</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price (K)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Amount:</span>
                  <span className="font-bold">
                    K {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Totals</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Materials Subtotal:</span>
            <span className="text-lg font-bold">
              K {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <Label htmlFor="labor_cost" className="font-medium">Labour & Transport:</Label>
            <div className="flex items-center gap-2 group">
              <span className="text-muted-foreground font-medium">K</span>
              <Input
                id="labor_cost"
                type="number"
                min="0"
                step="0.01"
                value={laborCost}
                onChange={(e) => onLaborCostChange(parseFloat(e.target.value) || 0)}
                className="w-full sm:w-40 text-right font-bold bg-background"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border/50">
            <span className="text-lg font-black uppercase tracking-tighter">Net Total</span>
            <div className="text-2xl font-black text-primary drop-shadow-sm">
              K {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder="Terms and conditions, payment details, etc."
        />
      </div>
    </div>
  );
}
