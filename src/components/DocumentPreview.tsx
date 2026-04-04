import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentPreviewProps {
  doc: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreview({ doc, open, onOpenChange }: DocumentPreviewProps) {
  if (!doc) return null;

  const items = doc.content?.items || [];
  const subtotal = doc.content?.subtotal || 0;
  const laborCost = doc.content?.labor_cost || 0;
  const total = doc.content?.total || 0;
  const docDate = doc.content?.document_date
    ? new Date(doc.content.document_date)
    : new Date(doc.created_at);
  const dateStr = format(docDate, "dd/MM/yyyy");

  const minRows = 10;
  const emptyRows = Math.max(0, minRows - items.length);

  const formatAmount = (amount: number) => {
    const [kwacha, tambala] = amount.toFixed(2).split(".");
    return { kwacha: Number(kwacha).toLocaleString(), tambala };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Document Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[80vh]">
          <div className="p-6">
            {/* A4-like paper */}
            <div
              className="bg-white text-black shadow-lg mx-auto border"
              style={{
                width: "100%",
                maxWidth: 595,
                minHeight: 842,
                padding: "16px 24px",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 11,
              }}
            >
              {/* Header image */}
              <div style={{ position: "relative", marginBottom: 4 }}>
                <img
                  src="/images/pdf-header.png"
                  alt="Header"
                  style={{ width: "100%", height: "auto" }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 6,
                    right: 12,
                    fontSize: 9,
                    color: "#000",
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                  }}
                >
                  {dateStr}
                </span>
              </div>

              {/* Separator */}
              <div
                style={{
                  borderBottom: "1.5px solid #1e3a8a",
                  marginBottom: 12,
                }}
              />

              {/* Attention To */}
              <div style={{ marginBottom: 8, fontSize: 11 }}>
                <span>Att: {doc.content?.attention_to || ""}</span>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    flex: 1,
                    width: "70%",
                    marginLeft: 4,
                  }}
                >
                  &nbsp;
                </span>
              </div>

              {/* Title */}
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 13,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                {doc.title}
              </div>

              {/* Table */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 10,
                }}
              >
                {/* Header Row 1 */}
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "4px 2px",
                        width: 40,
                        fontWeight: "bold",
                      }}
                    >
                      QTY
                    </th>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "4px 2px",
                        fontWeight: "bold",
                      }}
                    >
                      DESCRIPTION
                    </th>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "4px 2px",
                        width: 40,
                        fontWeight: "bold",
                      }}
                    >
                      @
                    </th>
                    <th
                      colSpan={2}
                      style={{
                        border: "1px solid #000",
                        padding: "4px 2px",
                        width: 100,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      AMOUNT
                    </th>
                  </tr>
                  {/* Header Row 2 - Blue */}
                  <tr style={{ backgroundColor: "#1e3a8a", color: "#fff" }}>
                    <th style={{ border: "1px solid #1e3a8a", padding: "3px 2px" }}></th>
                    <th style={{ border: "1px solid #1e3a8a", padding: "3px 2px" }}></th>
                    <th style={{ border: "1px solid #1e3a8a", padding: "3px 2px" }}></th>
                    <th
                      style={{
                        border: "1px solid #fff",
                        padding: "3px 2px",
                        textAlign: "center",
                        width: 50,
                      }}
                    >
                      K
                    </th>
                    <th
                      style={{
                        border: "1px solid #fff",
                        padding: "3px 2px",
                        textAlign: "center",
                        width: 50,
                      }}
                    >
                      t
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, idx: number) => {
                    const { kwacha, tambala } = formatAmount(item.amount);
                    return (
                      <tr key={idx}>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 4px",
                            textAlign: "center",
                          }}
                        >
                          {item.qty}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 4px",
                          }}
                        >
                          {item.description}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 4px",
                            textAlign: "right",
                          }}
                        >
                          {item.unit_price?.toLocaleString()}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 4px",
                            textAlign: "right",
                          }}
                        >
                          {kwacha}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "3px 4px",
                            textAlign: "center",
                          }}
                        >
                          {tambala}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Empty rows */}
                  {Array.from({ length: emptyRows }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td style={{ border: "1px solid #000", padding: "3px 4px", height: 20 }}>&nbsp;</td>
                      <td style={{ border: "1px solid #000", padding: "3px 4px" }}>&nbsp;</td>
                      <td style={{ border: "1px solid #000", padding: "3px 4px" }}>&nbsp;</td>
                      <td style={{ border: "1px solid #000", padding: "3px 4px" }}>&nbsp;</td>
                      <td style={{ border: "1px solid #000", padding: "3px 4px", textAlign: "center" }}>00</td>
                    </tr>
                  ))}
                  {/* Total Cost of Materials */}
                  <tr style={{ fontWeight: "bold" }}>
                    <td
                      colSpan={3}
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                      }}
                    >
                      TOTAL COST OF MATERIALS
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                        textAlign: "right",
                      }}
                    >
                      {formatAmount(subtotal).kwacha}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                        textAlign: "center",
                      }}
                    >
                      {formatAmount(subtotal).tambala}
                    </td>
                  </tr>
                  {/* Labour */}
                  <tr style={{ fontStyle: "italic", fontWeight: "bold" }}>
                    <td
                      colSpan={3}
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                      }}
                    >
                      Labour cost and transport
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                        textAlign: "right",
                      }}
                    >
                      {formatAmount(laborCost).kwacha}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                        textAlign: "center",
                      }}
                    >
                      {formatAmount(laborCost).tambala}
                    </td>
                  </tr>
                  {/* Net Total */}
                  <tr style={{ fontWeight: "bold", fontSize: 12 }}>
                    <td
                      colSpan={3}
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                      }}
                    >
                      NET TOTAL
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                        textAlign: "right",
                      }}
                    >
                      {formatAmount(total).kwacha}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px",
                        textAlign: "center",
                      }}
                    >
                      {formatAmount(total).tambala}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Orange footer bar */}
              <div
                style={{
                  height: 6,
                  backgroundColor: "#f59e0b",
                  width: "100%",
                }}
              />

              {/* Notes */}
              {doc.content?.notes && (
                <div style={{ marginTop: 12, fontSize: 9, whiteSpace: "pre-wrap" }}>
                  {doc.content.notes}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
