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

  const formatGroupedNumber = (value: number) =>
    Number(value || 0).toLocaleString("en-US").replace(/,/g, ", ");

  const formatAmount = (amount: number) => {
    const [kwacha, tambala] = amount.toFixed(2).split(".");
    return { kwacha: formatGroupedNumber(Number(kwacha)), tambala };
  };

  const tableBorderColor = "#1f1f1f";
  const tableBorder = `1px solid ${tableBorderColor}`;
  const tableBlue = "#0f3358";
  const tableHeaderFont = '"Times New Roman", Times, serif';
  const tableBodyFont = '"Century Gothic", "Trebuchet MS", Arial, sans-serif';
  const bodyCellStyle = {
    border: tableBorder,
    padding: "5px 8px",
    fontFamily: tableBodyFont,
    fontSize: 9.5,
    lineHeight: 1.1,
    verticalAlign: "middle" as const,
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
                    top: 10,
                    right: 4,
                    fontSize: 14,
                    color: "#000",
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                  }}
                >
                  Date: {dateStr}
                </span>
              </div>

              {/* Separator */}
              <div
                style={{
                  // borderBottom: "1.5px solid #1e3a8a",
                  marginBottom: 12,
                }}
              />

              {/* Attention To */}
              <div style={{ marginBottom: 12, fontSize: 12, marginTop: 24, marginLeft: 12, fontFamily: "Times New Roman", }}>
                <span>Att: {doc.content?.attention_to || ""}</span>
                {/* <span
                  style={{
                    // borderBottom: "1px dotted #000",
                    display: "inline-block",
                    flex: 1,
                    width: "70%",
                    marginLeft: 4,
                  }}
                >
                  &nbsp;
                </span> */}
              </div>

              {/* Title */}
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontFamily: "Times New Roman",
                  fontSize: 16,
                  marginBottom: 12,
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
                  tableLayout: "fixed",
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                <colgroup>
                  <col style={{ width: "10.5%" }} />
                  <col style={{ width: "52%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "22.5%" }} />
                  <col style={{ width: "4%" }} />
                </colgroup>
                {/* Header Row 1 */}
                <thead>
                  <tr>
                    <th
                      style={{
                        border: tableBorder,
                        padding: "7px 4px 5px",
                        fontWeight: "bold",
                        fontFamily: tableHeaderFont,
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      QTY
                    </th>
                    <th
                      style={{
                        border: tableBorder,
                        padding: "7px 4px 5px",
                        fontWeight: "bold",
                        fontFamily: tableHeaderFont,
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      DESCRIPTION
                    </th>
                    <th
                      style={{
                        border: tableBorder,
                        padding: "7px 4px 5px",
                        fontWeight: "bold",
                        fontFamily: tableHeaderFont,
                        fontSize: 14,
                        fontStyle: "italic",
                        lineHeight: 1,
                      }}
                    >
                      @
                    </th>
                    <th
                      colSpan={2}
                      style={{
                        border: tableBorder,
                        padding: "7px 4px 5px",
                        fontWeight: "bold",
                        textAlign: "center",
                        fontFamily: tableHeaderFont,
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      AMOUNT
                    </th>
                  </tr>
                  <tr>
                    <th
                      colSpan={3}
                      style={{
                        border: tableBorder,
                        padding: "7px 0",
                        backgroundColor: tableBlue,
                      }}
                    ></th>
                    <th
                      style={{
                        border: tableBorder,
                        padding: "5px 2px",
                        textAlign: "center",
                        fontFamily: tableHeaderFont,
                        fontSize: 12,
                        fontStyle: "italic",
                        lineHeight: 1,
                      }}
                    >
                      K
                    </th>
                    <th
                      style={{
                        border: tableBorder,
                        padding: "5px 2px",
                        textAlign: "center",
                        fontFamily: tableHeaderFont,
                        fontSize: 12,
                        fontStyle: "italic",
                        lineHeight: 1,
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
                            ...bodyCellStyle,
                            textAlign: "center",
                          }}
                        >
                          {item.qty}
                        </td>
                        <td
                          style={{
                            ...bodyCellStyle,
                          }}
                        >
                          {item.description}
                        </td>
                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "right",
                            paddingRight: 10,
                          }}
                        >
                          {formatGroupedNumber(item.unit_price || 0)}
                        </td>
                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "right",
                            paddingRight: 10,
                          }}
                        >
                          {kwacha}
                        </td>
                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "center",
                            paddingLeft: 0,
                            paddingRight: 0,
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
                      <td style={{ ...bodyCellStyle, height: 20 }}>&nbsp;</td>
                      <td style={bodyCellStyle}>&nbsp;</td>
                      <td style={bodyCellStyle}>&nbsp;</td>
                      <td style={bodyCellStyle}>&nbsp;</td>
                      <td style={{ ...bodyCellStyle, textAlign: "center", paddingLeft: 0, paddingRight: 0 }}>00</td>
                    </tr>
                  ))}
                  {/* Total Cost of Materials */}
                  <tr style={{ height: 38 }}>
                    <td
                      style={{
                        ...bodyCellStyle,
                      }}
                    >
                      &nbsp;
                    </td>
                    <td
                      style={{
                        ...bodyCellStyle,
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: 11,
                        letterSpacing: "0.01em",
                      }}
                    >
                      TOTAL COST OF MATERIALS
                    </td>
                    <td
                      style={{
                        ...bodyCellStyle,
                      }}
                    >
                      &nbsp;
                    </td>
                    <td
                      style={{
                        ...bodyCellStyle,
                        textAlign: "right",
                        paddingRight: 10,
                        fontWeight: "bold",
                        fontSize: 11,
                      }}
                    >
                      {formatAmount(subtotal).kwacha}
                    </td>
                    <td
                      style={{
                        ...bodyCellStyle,
                        textAlign: "center",
                        paddingLeft: 0,
                        paddingRight: 0,
                        fontWeight: "bold",
                        fontSize: 11,
                      }}
                    >
                      {formatAmount(subtotal).tambala}
                    </td>
                  </tr>
                  <tr style={{ height: 34 }}>
                    <td
                      colSpan={3}
                      style={{
                        ...bodyCellStyle,
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: 11,
                      }}
                    >
                      Labour cost and transport
                    </td>
                    <td
                      style={{
                        ...bodyCellStyle,
                        textAlign: "right",
                        paddingRight: 10,
                        fontWeight: "bold",
                        fontSize: 11,
                      }}
                    >
                      {formatAmount(laborCost).kwacha}
                    </td>
                    <td
                      style={{
                        ...bodyCellStyle,
                        textAlign: "center",
                        paddingLeft: 0,
                        paddingRight: 0,
                        fontWeight: "bold",
                        fontSize: 11,
                      }}
                    >
                      {formatAmount(laborCost).tambala}
                    </td>
                  </tr>
                  <tr style={{ height: 34 }}>
                    <td
                      colSpan={3}
                      style={{
                        ...bodyCellStyle,
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: 11,
                      }}
                    >
                      NET TOTAL
                    </td>
                    <td
                      style={{
                        ...bodyCellStyle,
                        textAlign: "right",
                        paddingRight: 10,
                        fontWeight: "bold",
                        fontSize: 11,
                      }}
                    >
                      {formatAmount(total).kwacha}
                    </td>
                    <td
                      style={{
                        ...bodyCellStyle,
                        textAlign: "center",
                        paddingLeft: 0,
                        paddingRight: 0,
                        fontWeight: "bold",
                        fontSize: 11,
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
